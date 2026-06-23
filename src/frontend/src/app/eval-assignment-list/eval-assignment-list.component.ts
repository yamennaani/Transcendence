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

interface EnrolledStudent {
  userId: number;
  username: string;
  email: string;
}

interface UnmatchedStudentRow {
  userId: number;
  username: string;
  email: string;
  evalueeAssignments: number;
  requiredRounds: number;
  missingRounds: number;
  groupNames: string;
}

interface ManualPairingEvalueeGroupOption {
  groupId: number;
  groupName: string;
  members: string;
  round: number;
  evalueeAssignments: number;
  requiredRounds: number;
}

interface ManualPairingEvaluatorOption {
  userId: number;
  username: string;
  groupId: number;
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
  // ── Services ───────────────────────────────────────────────  
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private evalService = inject(EvalService);
  private courseService = inject(CourseService);
  private groupService = inject(GroupService);
  private loadingService = inject(LoadingService);

  // ── Assignment context ─────────────────────────────────────
  assignmentId = signal<number | null>(null);
  classId = signal<number | null>(null);
  requiredRounds = signal<number | null>(null);
  assignmentName = signal<string | null>(null)
  courseName = signal<string | null>(null)

  // ── Loaded data ────────────────────────────────────────────  
  enrolledStudents = signal<EnrolledStudent[]>([]);
  assignmentGroups = signal<AssignmentGroup[]>([]);
  evalAssignments = signal<EvalAssignmentDisplayRow[]>([]);

  // ── Page state ─────────────────────────────────────────────
  loading = signal(false);
  error = signal<string | null>(null);

  // ── Round display state ────────────────────────────────────
  selectedRound = signal<number | null>(null);

  // ── Edit existing pairing modal ────────────────────────────
  editingPairing = signal<EvalAssignmentDisplayRow | null>(null);
  editEvaluatorGroupId = signal<number | null>(null);
  editEvaluatorUserId = signal<number | null>(null);
  editPairingError = signal<string | null>(null);

  // ── Diagnostic modals ──────────────────────────────────────
  showEvaluatorWorkload = signal(false);
  showUnmatchedStudents = signal(false);
  
  // ── Create single pairing modal ────────────────────────────
  showCreateSinglePairing = signal(false);
  createPairingEvalueeGroup = signal<ManualPairingEvalueeGroupOption | null>(null);
  createPairingEvaluator = signal<ManualPairingEvaluatorOption | null>(null);
  createPairingError = signal<string | null>(null);


  // ── Round display computed values ──────────────────────────
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

  roundNumbers = computed(() => this.pairingsByRound().map(group => group.round));
  
  selectedRoundGroup = computed(() => {
    const groups = this.pairingsByRound();
    if (groups.length === 0) { return null; }
    const selected = this.selectedRound();
    if (selected === null) { return groups[0]; }
    return groups.find(group => group.round === selected) ?? groups[0];
  });

  // ── Edit existing pairing computed values ──────────────────
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

  // ── Diagnostic computed values ─────────────────────────────
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

  // check: -) student is enrolled but in no assignment group
  //        -) student is in an assignment group, but that group has too few evaluee pairings
  unmatchedStudents = computed<UnmatchedStudentRow[]>(() => {
    const requiredRounds = this.requiredRounds();
    if (!requiredRounds || requiredRounds <= 0) { return []; }

    const evalueeCountByGroupId = new Map<number, number>();
    for (const row of this.evalAssignments()) {
      const current = evalueeCountByGroupId.get(row.evalueeGroupId) ?? 0;
      evalueeCountByGroupId.set(row.evalueeGroupId, current + 1);
    }
    const evalueeCountByUserId = new Map<number, number>();
    const groupNamesByUserId = new Map<number, string[]>();
    for (const group of this.assignmentGroups()) {
      const groupEvalueeCount = evalueeCountByGroupId.get(group.id) ?? 0;
      for (const member of group.members) {
        const current = evalueeCountByUserId.get(member.userId) ?? 0;
        evalueeCountByUserId.set(member.userId, current + groupEvalueeCount);
        const existingGroups = groupNamesByUserId.get(member.userId) ?? [];
        existingGroups.push(group.name);
        groupNamesByUserId.set(member.userId, existingGroups);
      }
    }
    return this.enrolledStudents()
      .map(student => { 
        const evalueeAssignments = evalueeCountByUserId.get(student.userId) ?? 0; 
        return {
          userId: student.userId,
          username: student.username,
          email: student.email,
          evalueeAssignments,
          requiredRounds,
          missingRounds: requiredRounds - evalueeAssignments,
          groupNames:
            (groupNamesByUserId.get(student.userId) ?? []).join(', ') ||
            'No assignment group',
        }; })
      .filter(row => row.missingRounds > 0)
      .sort((a, b) => {
        if (a.missingRounds !== b.missingRounds) {
          return b.missingRounds - a.missingRounds; }
        return a.username.localeCompare(b.username);
      });
  });

  // ── Create single pairing computed values ──────────────────
  manualPairingEvalueeGroupOptions = computed<ManualPairingEvalueeGroupOption[]>(() => {
    const requiredRounds = this.requiredRounds();
    if (!requiredRounds || requiredRounds <= 0) { return []; }
    const evalueeRoundsByGroupId = new Map<number, Set<number>>();
    for (const row of this.evalAssignments()) {
      const rounds = evalueeRoundsByGroupId.get(row.evalueeGroupId) ?? new Set<number>();
      rounds.add(row.round);
      evalueeRoundsByGroupId.set(row.evalueeGroupId, rounds);
    }
    const options: ManualPairingEvalueeGroupOption[] = [];
    for (const group of this.assignmentGroups()) {
      const existingRounds = evalueeRoundsByGroupId.get(group.id) ?? new Set<number>();
      for (let round = 1; round <= requiredRounds; round++) {
        if (!existingRounds.has(round)) {
          options.push({
            groupId: group.id,
            groupName: group.name,
            members: this.memberNames(group),
            round,
            evalueeAssignments: existingRounds.size,
            requiredRounds, }); 
        }
      }
    }
    return options.sort((a, b) => { 
      if (a.round !== b.round) {return a.round - b.round;}
      return a.groupName.localeCompare(b.groupName); });
  });

  manualPairingEvaluatorOptions = computed<ManualPairingEvaluatorOption[]>(() => {
    const countByUserId = new Map<number, number>();
    for (const row of this.evalAssignments()) {
      const current = countByUserId.get(row.evaluatorUserId) ?? 0;
      countByUserId.set(row.evaluatorUserId, current + 1);
    }
    const candidates: ManualPairingEvaluatorOption[] = [];
    for (const group of this.assignmentGroups()) {
      for (const member of group.members) {
        candidates.push({
          userId: member.userId,
          username: member.user?.username ?? `user #${member.userId}`,
          groupId: group.id,
          groupName: group.name,
          count: countByUserId.get(member.userId) ?? 0, });
      }
    }
    return candidates.sort((a, b) => { if (a.count !== b.count) { return a.count - b.count; }
      return a.username.localeCompare(b.username); });
  });

  availableManualPairingEvaluators = computed<ManualPairingEvaluatorOption[]>(() => {
    const evalueeGroup = this.createPairingEvalueeGroup();
    if (!evalueeGroup) { return this.manualPairingEvaluatorOptions(); }
    return this.manualPairingEvaluatorOptions().filter(
      evaluator => evaluator.groupId !== evalueeGroup.groupId );
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
        //console.log('assignment:', assignment);
        this.assignmentName.set(assignment.name ?? `Assignment #${assignmentId}`);
        const classId = assignment.classid ?? assignment.classId;
        //console.log('classId:', classId);
        const requiredRounds = parseInt(assignment.req_eval, 10);
        //console.log('requiredRounds:', requiredRounds);
        this.classId.set(classId ?? null);
        this.requiredRounds.set(Number.isNaN(requiredRounds) ? null : requiredRounds);
        if (!classId) return;
        this.loadEnrolledStudents(classId);
        this.courseService.getClass(classId).subscribe({
          next: (course: any) => {
            this.courseName.set(course.name ?? `Class #${classId}`); },
          error: () => {
            this.courseName.set(`Class #${classId}`); }, });
      },
      error: () => {
        this.assignmentName.set(`Assignment #${assignmentId}`); },
    });
  }  

  private loadEnrolledStudents(classId: number): void {
    this.courseService.getClassStudents(classId).subscribe({
      next: students => {
        this.enrolledStudents.set(
          students.map(student => ({
            userId: student.id,
            username: student.username,
            email: student.email, })) ); },
      error: () => {
        this.enrolledStudents.set([]);
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
    //console.log('openEditPairing clicked', row);
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

  saveCreateSinglePairing(): void {
    const assignmentId = this.assignmentId();
    const evalueeGroup = this.createPairingEvalueeGroup();
    const evaluator = this.createPairingEvaluator();
    if (!assignmentId) { this.createPairingError.set('Cannot create pairing without an assignment id.'); return; }
    if (!evalueeGroup) { this.createPairingError.set('Please select an unmatched evaluee group.'); return; }
    if (!evaluator) { this.createPairingError.set('Please select an evaluator.'); return; }
    if (evalueeGroup.groupId === evaluator.groupId) { this.createPairingError.set('A group cannot evaluate itself.'); return; }

    this.createPairingError.set(null);
    this.loading.set(true);
    this.loadingService.show();

    this.evalService.createEvalAssignment({
      assignmentId,
      evalueeGroupId: evalueeGroup.groupId,
      evaluatorGroupId: evaluator.groupId,
      evaluatorUserId: evaluator.userId,
      round: evalueeGroup.round, }).subscribe({
      next: () => {
        this.closeCreateSinglePairingModal();
        this.loadEvalAssignments(assignmentId);
        this.loading.set(false);
        this.loadingService.hide(); },
      error: (err: any) => {
        this.createPairingError.set(
          this.errorMessage(err, 'Failed to create single pairing.'));
        this.loading.set(false);
        this.loadingService.hide(); }, });
  }

  openCreateSinglePairingModal(): void {
    this.createPairingError.set(null);

    const firstEvalueeGroup = this.manualPairingEvalueeGroupOptions()[0] ?? null;
    this.createPairingEvalueeGroup.set(firstEvalueeGroup);

    if (firstEvalueeGroup) {
      const firstEvaluator =
        this.manualPairingEvaluatorOptions().find(
          evaluator => evaluator.groupId !== firstEvalueeGroup.groupId
        ) ?? null;

      this.createPairingEvaluator.set(firstEvaluator);
    } else {
      this.createPairingEvaluator.set(null);
    }

    this.showCreateSinglePairing.set(true);
  }

  closeCreateSinglePairingModal(): void {
    this.showCreateSinglePairing.set(false);
    this.createPairingEvalueeGroup.set(null);
    this.createPairingEvaluator.set(null);
    this.createPairingError.set(null);
  }

  onManualPairingEvalueeGroupChanged(option: ManualPairingEvalueeGroupOption): void {
    this.createPairingEvalueeGroup.set(option);
    const currentEvaluator = this.createPairingEvaluator();
    if (currentEvaluator && currentEvaluator.groupId !== option.groupId) { return; }
    const firstEvaluator =
      this.manualPairingEvaluatorOptions().find(evaluator => evaluator.groupId !== option.groupId) ?? null;
    this.createPairingEvaluator.set(firstEvaluator);
  }

}