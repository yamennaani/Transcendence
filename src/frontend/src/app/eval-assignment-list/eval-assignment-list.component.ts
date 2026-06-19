import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EvalAssignment, EvalService} from '../core/services/eval-service/eval-service';
//import { ListComponent, ListColumn } from '../shared/list.component';
import { ContainerComponent, ContainerConfig } from '../shared/container.component';
import { BtnComponent } from '../shared/btn.component';
import { LoadingService } from '../core/services/loading-service/loading.service';

import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { CourseService } from '../core/services/course-service/course-service';
import { GroupService } from '../core/services/group-service/group-service';

import { NgStyle } from '@angular/common';
import { FormsModule } from '@angular/forms';


// as a frontend display shape I want: 
interface EvalAssignmentDisplayRow {
  id: number;
  round: number;
  status: string;

  evalueeGroupId: number;
  evalueeGroupName: string;
  evalueeMembers: string;

  evaluatorUserId: number;
  evaluatorName: string;
  evaluatorGroupId: number | null;
  evaluatorGroupName: string;
}

// display interface for Assignment-Group (for edit-functionality)
interface AssignmentGroup {
  id: number;
  name: string;
  leaderId: number;
  members: {
    id: number;
    userId: number;
    user?: {
      id: number;
      username: string;
      email: string;
    };
  }[];
}

// interface to know how many times student acts in the role of evaluator:
interface EvaluatorWorkloadRow {
  userId: number;
  username: string;
  groupName: string;
  count: number;
}

@Component({
  selector: 'app-eval-assignment-list',
  standalone: true,
  //imports: [ListComponent, BtnComponent],
  imports: [ContainerComponent, BtnComponent, NgStyle, FormsModule],
  templateUrl: './eval-assignment-list.component.html',
})
export class EvalAssignmentListComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private evalService = inject(EvalService);
  private courseService = inject(CourseService);
  private groupService = inject(GroupService);
  private loadingService = inject(LoadingService);

  assignmentId = signal<number | null>(null);
  assignmentName = signal<string | null>(null)
  courseName = signal<string | null>(null)
  evalAssignments = signal<EvalAssignmentDisplayRow[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Assignment groups for edit-functionality:
  assignmentGroups = signal<AssignmentGroup[]>([]);
  editingPairing = signal<EvalAssignmentDisplayRow | null>(null);
  editEvaluatorGroupId = signal<number | null>(null);
  editEvaluatorUserId = signal<number | null>(null);
  editPairingError = signal<string | null>(null);

  pairingsByRound = computed(() => {
    const map = new Map<number, EvalAssignmentDisplayRow[]>();
    for (const row of this.evalAssignments()) {
      const existing = map.get(row.round) ?? [];
      existing.push(row);
      map.set(row.round, existing);
    }
    return Array.from(map.entries())
    .sort(([roundA], [roundB]) => roundA - roundB)
    .map(([round, rows]) => ({
      round,
      rows: [...rows].sort((a, b) => a.evalueeGroupName.localeCompare(b.evalueeGroupName)),
    }));
  });

  selectedRound = signal<number | null>(null);
  roundNumbers = computed(() => this.pairingsByRound().map(group => group.round));
  selectedRoundGroup = computed(() => {
    const groups = this.pairingsByRound();
    if (groups.length === 0) { return null; }
    const selected = this.selectedRound();
    if (selected === null) { return groups[0]; }
    return groups.find(group => group.round === selected) ?? groups[0];
  });


  showEvaluatorWorkload = signal(false);
  evaluatorWorkload = computed<EvaluatorWorkloadRow[]>(() => {
    const countByUserId = new Map<number, number>();
    for (const row of this.evalAssignments()) {
      const current = countByUserId.get(row.evaluatorUserId) ?? 0;
      countByUserId.set(row.evaluatorUserId, current + 1);
    }

    const studentsByUserId = new Map<number, EvaluatorWorkloadRow>();
    for (const group of this.assignmentGroups()) {
      for (const member of group.members) {
        if (!studentsByUserId.has(member.userId)) {
          studentsByUserId.set(member.userId, {
            userId: member.userId,
            username: member.user?.username ?? `user #${member.userId}`,
            groupName: group.name,
            count: countByUserId.get(member.userId) ?? 0, });
        }
      }
    }

    return Array.from(studentsByUserId.values()).sort((a, b) => {
      if (a.count !== b.count) { return a.count - b.count; }
      return a.username.localeCompare(b.username); });
  });

  // ── Container configs ──────────────────────────────────────
  readonly flatConfig: ContainerConfig   = { variant: 'flat',  height: 'auto', scrollable: false };
  
  // ── Styles ─────────────────────────────────────────────────
  readonly pageStyle = {flex: '1', height: '100vh', overflowY: 'auto', padding: '32px', boxSizing: 'border-box' as const, 
    display: 'flex', flexDirection: 'column' as const, gap: '20px', };
  readonly headerRowStyle = {display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', 
    gap: '20px', flexWrap: 'wrap' as const, };
  readonly h1Style = { margin: '0', fontSize: '1.75rem', };
  readonly overlineStyle = { fontSize: '0.75rem', textTransform: 'uppercase' as const, letterSpacing: '0.08em',
    opacity: '0.75', marginBottom: '6px', };
  readonly sublineStyle = { margin: '6px 0 0', opacity: '0.75', fontSize: '0.9rem', };
  readonly actionsStyle = { display: 'flex', gap: '10px', flexWrap: 'wrap' as const, };
  readonly errorBannerStyle = { border: '1px solid #f0aaaa', background: '#fff0f0', color: '#9f1d1d',
    borderRadius: '8px', padding: '10px 14px', fontSize: '0.875rem', };
  readonly loadingStyle = { fontSize: '0.875rem', opacity: '0.75', };
  readonly overlayStyle = { position: 'fixed', inset: '0', background: 'oklch(0% 0 0 / 0.7)', backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: '100', };
  readonly modalTitleStyle = { fontSize: '1.125rem', fontWeight: '600', };
  readonly modalBodyStyle = { display: 'flex', flexDirection: 'column' as const, gap: '14px', };
  readonly fieldLabelStyle = { display: 'block', fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.06em',
    textTransform: 'uppercase' as const, opacity: '0.65', marginBottom: '4px', };
  readonly inputStyle = { width: '100%', boxSizing: 'border-box' as const, padding: '9px 12px', background: '#050712',
    border: '1px solid #2a2f45', borderRadius: '8px', color: 'white', fontSize: '0.875rem', };
  readonly readonlyFieldStyle = { fontSize: '0.875rem', opacity: '0.8', border: '1px solid #2a2f45', 
    borderRadius: '8px', padding: '9px 12px', };
  readonly modalActionsStyle = { display: 'flex', justifyContent: 'flex-end', gap: '8px', };
  readonly pairingsListStyle = { display: 'flex', flexDirection: 'column' as const, gap: '12px', };
  readonly roundButtonRowStyle = { display: 'flex', gap: '8px', flexWrap: 'wrap' as const, };
  readonly selectedRoundListStyle = { display: 'flex', flexDirection: 'column' as const, gap: '10px', };
  readonly roundHeadingStyle = { margin: '12px 0 0', fontSize: '1.1rem', };
  readonly sectionHeadingStyle = { margin: '0', fontSize: '1.75rem', };
  readonly emptyStateStyle = { padding: '18px 20px', fontSize: '0.9rem', opacity: '0.65', };
  readonly cardContentStyle = { padding: '16px 20px', display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', gap: '16px', };
  readonly cardTitleStyle = { fontWeight: '600', color: 'oklch(94% 0.005 272)', marginBottom: '4px', };
  readonly cardSubtitleStyle = { fontSize: '0.8125rem', color: 'oklch(48% 0.01 272)', };
  readonly cardActionsStyle = { display: 'flex', alignItems: 'center', gap: '8px', };
  readonly workloadRowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    gap: '16px', padding: '10px 0', borderBottom: '1px solid #2a2f45', };  
  //readonly modalStyle = { background: '#0d0f1a', border: '1px solid #2a2f45', borderRadius: '16px', padding: '28px',  
  //  width: '440px', display: 'flex', flexDirection: 'column' as const, gap: '16px', boxShadow: '0 8px 32px oklch(0% 0 0 / 0.8)', };
readonly modalStyle = { background: '#0d0f1a', border: '1px solid #2a2f45', borderRadius: '16px', padding: '28px', width: '440px',
    maxHeight: '90vh', overflowY: 'auto' as const, boxSizing: 'border-box' as const, display: 'flex', flexDirection: 'column' as const,
    gap: '16px', boxShadow: '0 8px 32px oklch(0% 0 0 / 0.8)', };

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const raw = params['assignmentId'] ?? params['assId'];

      if (!raw) { this.error.set('Missing assignmentId in the URL.'); return; }

      const id = parseInt(raw, 10);
      if (Number.isNaN(id)) { this.error.set('Invalid assignmentId in the URL.'); return; }

      this.assignmentId.set(id);
      this.loadEvalAssignmentHeader(id);
      this.loadGroupsForAssignment(id);
      this.loadEvalAssignments(id);
    });
  }

  generateSimplePairings(): void {
    const id = this.assignmentId();
    if (!id) { this.error.set('Cannot generate pairings without an assignment id.'); return; }

    this.loading.set(true);
    this.error.set(null);
    this.loadingService.show();

    this.evalService.generateSimplePairings(id).subscribe({
      next: rows => {
        this.loading.set(false);
        this.loadingService.hide();
        this.loadEvalAssignments(id);
      },
      error: err => {
        this.error.set(this.errorMessage(err, 'Failed to generate pairings.'));
        this.loading.set(false);
        this.loadingService.hide();
      },
    });
  }

  // errorMessage helper function (for passing on error message from the backend)
  private errorMessage(err: any, fallback: string): string {
    return (
      err?.error?.message ??
      err?.error?.error ??
      err?.message ??
      fallback
    );
  }

  // delete one EvalAssignment-pairing 
  deleteEvalAssignment(row: EvalAssignmentDisplayRow): void {
    const ok = window.confirm(`Are you sure you want to delete this pairing?\n\n` +
      `${row.evalueeGroupName} evaluated by ${row.evaluatorName}`);
    if (!ok) return;

    this.loading.set(true);
    this.error.set(null);
    this.loadingService.show();

    this.evalService.deleteEvalAssignment(row.id).subscribe({
      next: () => { 
        this.evalAssignments.update(rows => rows.filter(ea => ea.id !== row.id) );
        this.loading.set(false);
        this.loadingService.hide(); 
      },
      error: err => {
        this.error.set(err?.error?.message ?? 'Failed to delete evaluation pairing.' );
        this.loading.set(false);
        this.loadingService.hide();         
      }, });
  }

  // delete all EvalAssignment-pairings
  deleteAllEvalAssignments(): void {
    const id = this.assignmentId();
    
    if (!id) { this.error.set('Cannot delete pairings without an assignment id.'); return; }
    if (this.evalAssignments().length === 0) { return; }

    const ok = window.confirm('Are you sure you want to delete all evaluation pairings for this assignment?' );
    if (!ok) return;

    this.loading.set(true);
    this.error.set(null);
    this.loadingService.show();

    this.evalService.deleteEvalAssignments(id).subscribe({
      next: () => {
        this.evalAssignments.set([]);
        this.loading.set(false);
        this.loadingService.hide();
      },
      error: err => {
        this.error.set(
          err?.error?.message ?? 'Failed to delete evaluation pairings.'
        );

        this.loading.set(false);
        this.loadingService.hide();
      },
    });
  }  

  goBackToAssignment(): void {
    const id = this.assignmentId();

    if (!id) { this.router.navigate(['/assignment']); return; }

    this.router.navigate(['/assignment-detail'], {
      queryParams: { assId: id },
    });
  }

  private memberNames(group: any): string {
  const members = group?.members ?? [];
  if (members.length === 0) { return 'No members'; }
  return members
    .map((m: any) => m.user?.username ?? `user #${m.userId}`)
    .join(', ');
  }

  private evaluatorName(group: any, evaluatorUserId: number): string {
    const member = (group?.members ?? []).find((m: any) => m.userId === evaluatorUserId );
    return member?.user?.username ?? `user #${evaluatorUserId}`;
  }

  private loadEvalAssignmentHeader(assignmentId: number): void {
    this.evalService.getAssignment(assignmentId).subscribe({
      next: (assignment: any) => {
        this.assignmentName.set(assignment.name ?? `Assignment #${assignmentId}`);
        const classId = assignment.classid ?? assignment.classId;
        if (!classId) return;
        this.courseService.getClass(classId).subscribe({
          next: (course: any) => {
            this.courseName.set(course.name ?? `Class #${classId}`);
          },
          error: () => {
            this.courseName.set(`Class #${classId}`);
          },
        });
      },
      error: () => {
        this.assignmentName.set(`Assignment #${assignmentId}`);
      },
    });
  }

  private loadEvalAssignments(assignmentId: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.evalService.getEvalAssignments(assignmentId).pipe(
      switchMap((rows: EvalAssignment[]) => {
        //console.log('Raw eval assignments from backend:', rows);
        //console.log('Rounds received:', rows.map(row => row.round));
        if (rows.length === 0) { return of([]); }

        const displayRowRequests = rows.map(row =>
          forkJoin({
            evalueeGroup: this.groupService.getGroup(row.evalueeGroupId).pipe(
              catchError(() => of(null))
            ),
            evaluatorGroup: row.evaluatorGroupId
              ? this.groupService.getGroup(row.evaluatorGroupId).pipe(
                  catchError(() => of(null))
                )
              : of(null),
          }).pipe(
            map(({ evalueeGroup, evaluatorGroup }) => {
              //console.log('evalueeGroup:', evalueeGroup);
              //console.log('evaluatorGroup:', evaluatorGroup);
              const displayRow: EvalAssignmentDisplayRow = {
                id: row.id,
                round: row.round,
                status: row.status,

                evalueeGroupId: row.evalueeGroupId,
                evalueeGroupName:
                  (evalueeGroup as any)?.name ?? `Group #${row.evalueeGroupId}`,
                evalueeMembers: this.memberNames(evalueeGroup),

                evaluatorUserId: row.evaluatorUserId,
                evaluatorName: evaluatorGroup
                  ? this.evaluatorName(evaluatorGroup, row.evaluatorUserId)
                  : `user #${row.evaluatorUserId}`,

                evaluatorGroupId: row.evaluatorGroupId,
                evaluatorGroupName: evaluatorGroup
                  ? ((evaluatorGroup as any)?.name ?? `Group #${row.evaluatorGroupId}`)
                  : 'No evaluator group',
              };

              return displayRow;
            })
          )
        );

        return forkJoin(displayRowRequests);
      })
    ).subscribe({
      next: displayRows => {
        this.evalAssignments.set(displayRows);
        const rounds = Array.from(new Set(displayRows.map(row => row.round)))
          .sort((a, b) => a - b);
        if (rounds.length > 0 && !this.selectedRound()) { this.selectedRound.set(rounds[0]); }
        this.loading.set(false);
      },
      error: err => {
        this.error.set(
          err?.error?.message ?? 'Failed to load evaluation pairings.'
        );
        this.loading.set(false);
      },
    });
  }

  availableEvaluatorGroups = computed(() => {
    const row = this.editingPairing();
    if (!row) { return this.assignmentGroups(); }
    return this.assignmentGroups().filter(group => group.id !== row.evalueeGroupId);
  });

  availableEvaluatorMembers = computed(() => {
    const groupId = this.editEvaluatorGroupId();
    if (!groupId) { return []; }
    return this.assignmentGroups().find(group => group.id === groupId)?.members ?? [];
  });

  private loadGroupsForAssignment(assignmentId: number): void {
    this.groupService.getGroupsForAssignment(assignmentId).subscribe({
      next: groups => {
        this.assignmentGroups.set(groups as AssignmentGroup[]);
      },
      error: () => {
        this.assignmentGroups.set([]);
      },
    });
  }

  openEditPairing(row: EvalAssignmentDisplayRow): void {
    console.log('openEditPairing clicked', row);
    this.editingPairing.set(row);
    this.editEvaluatorGroupId.set(row.evaluatorGroupId);
    this.editPairingError.set(null);
    const evaluatorGroup = this.assignmentGroups().find(group => group.id === row.evaluatorGroupId);
    const evaluatorIsInGroup = evaluatorGroup?.members.some(member => member.userId === row.evaluatorUserId);
    if (evaluatorIsInGroup) {
      this.editEvaluatorUserId.set(row.evaluatorUserId);
    } else {
      this.editEvaluatorUserId.set(evaluatorGroup?.members?.[0]?.userId ?? null);
    }
  }

  onEditEvaluatorGroupChanged(rawValue: string): void {
    const groupId = parseInt(rawValue, 10);
    if (Number.isNaN(groupId)) {
      this.editEvaluatorGroupId.set(null);
      this.editEvaluatorUserId.set(null);
      return;
    }
    this.editEvaluatorGroupId.set(groupId);
    const group = this.assignmentGroups().find(g => g.id === groupId);
    const firstMember = group?.members?.[0];
    this.editEvaluatorUserId.set(firstMember?.userId ?? null);
  }

  closeEditPairingModal(): void {
    this.editingPairing.set(null);
    this.editEvaluatorGroupId.set(null);
    this.editEvaluatorUserId.set(null);
    this.editPairingError.set(null);
  }  

  saveEditPairing(): void {
    const row = this.editingPairing();
    const assignmentId = this.assignmentId();
    const evaluatorGroupId = this.editEvaluatorGroupId();
    const evaluatorUserId = this.editEvaluatorUserId();

    if (!row || !assignmentId) { return; }
    if (!evaluatorGroupId || !evaluatorUserId) { this.editPairingError.set('Please select an evaluator group and evaluator.'); return; }
    if (evaluatorGroupId === row.evalueeGroupId) { this.editPairingError.set('A group cannot evaluate itself.'); return; }

    this.editPairingError.set(null);
    this.loading.set(true);
    this.loadingService.show();
    this.evalService.updateEvalAssignment(row.id, {
      assignmentId,
      evalueeGroupId: row.evalueeGroupId,
      evaluatorGroupId,
      evaluatorUserId,
      round: row.round,
      status: row.status as any,
      submissionId: null,
      evalResponseId: null,
    }).subscribe({
      next: () => {
        this.closeEditPairingModal();
        this.loadEvalAssignments(assignmentId);

        this.loading.set(false);
        this.loadingService.hide();
      },
      error: err => {
        console.error('Failed to update pairing:', err);
        console.error('Backend error body:', err?.error);

        this.editPairingError.set(
          err?.error?.message ?? 'Failed to update evaluation pairing.'
        );

        this.loading.set(false);
        this.loadingService.hide();
      },
    });
  }  

}