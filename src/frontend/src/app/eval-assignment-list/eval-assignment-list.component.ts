import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EvalAssignment, EvalService} from '../core/services/eval-service/eval-service';
import { ListComponent, ListColumn } from '../shared/list.component';
import { BtnComponent } from '../shared/btn.component';
import { LoadingService } from '../core/services/loading-service/loading.service';

import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { CourseService } from '../core/services/course-service/course-service';
import { GroupService } from '../core/services/group-service/group-service';


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

@Component({
  selector: 'app-eval-assignment-list',
  standalone: true,
  imports: [ListComponent, BtnComponent],
  template: `
    <div class="page">
      <div class="header-row">
        <div>
          <div class="overline">Peer evaluation</div>
          <h1>Evaluation pairings</h1>

          @if (assignmentName()) {
            <p class="subline">
              Assignment: <strong>{{ assignmentName() }}</strong>
              @if (courseName()) {
                · Course: <strong>{{ courseName() }}</strong>
              }
            </p>
          } @else if (assignmentId()) {
            <p class="subline">Assignment ID: {{ assignmentId() }}</p>
          } @else {
            <p class="subline">No assignment selected.</p>
          }
        </div>

        <div class="actions">
          <app-btn
            variant="secondary"
            (clicked)="goBackToAssignment()">
            Back to assignment
          </app-btn>

          <app-btn
            variant="primary"
            [disabled]="!assignmentId() || loading()"
            (clicked)="generateSimplePairings()">
            Generate simple pairings
          </app-btn>
        </div>
      </div>

      @if (error()) {
        <div class="error-banner">
          {{ error() }}
        </div>
      }

      @if (loading()) {
        <div class="loading">
          Loading evaluation pairings…
        </div>
      }

      <app-list
        [items]="evalAssignments()"
        [trackBy]="trackFn"
        [columns]="columns()"
        title="EvalAssignments"
        overline="Generated pairings"
        emptyMessage="No evaluation pairings found for this assignment."
        [pageSize]="10">
      </app-list>
    </div>
  `,
  styles: [`
    .page { flex: 1; overflow-y: auto; padding: 32px; display: flex; flex-direction: column; gap: 20px; }

    .header-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; flex-wrap: wrap; }

    h1 { margin: 0; font-size: 1.75rem; }

    .overline { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.75; margin-bottom: 6px; }

    .subline { margin: 6px 0 0; opacity: 0.75; font-size: 0.9rem; }

    .actions { display: flex; gap: 10px; flex-wrap: wrap; }

    .error-banner { border: 1px solid #f0aaaa; background: #fff0f0; color: #9f1d1d;
      border-radius: 8px; padding: 10px 14px; font-size: 0.875rem; }

    .loading { font-size: 0.875rem; opacity: 0.75; }
  `],
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

  readonly trackFn = (ea: EvalAssignmentDisplayRow) => ea.id;

columns = computed<ListColumn<EvalAssignmentDisplayRow>[]>(() => [
  { label: 'Evaluee',
    render: ea => `Evaluee: ${ea.evalueeGroupName}: ${ea.evalueeMembers}`, },
  { label: 'Evaluator', 
    render: ea => `Evaluator: ${ea.evaluatorName} from ${ea.evaluatorGroupName}`, },
  { label: 'Round',
    render: ea => `Round: ${ea.round}`, },
  { label: 'Status',
    render: ea => ea.status, },
]);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const raw = params['assignmentId'] ?? params['assId'];

      if (!raw) {
        this.error.set('Missing assignmentId in the URL.');
        return;
      }

      const id = parseInt(raw, 10);

      if (Number.isNaN(id)) {
        this.error.set('Invalid assignmentId in the URL.');
        return;
      }

      this.assignmentId.set(id);
      this.loadEvalAssignmentHeader(id);
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
        this.error.set(
          err?.error?.message ?? 'Failed to generate simple pairings.'
        );
        this.loading.set(false);
        this.loadingService.hide();
      },
    });
  }

  goBackToAssignment(): void {
    const id = this.assignmentId();

    if (!id) {
      this.router.navigate(['/assignment']);
      return;
    }

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
        if (rows.length === 0) {
          return of([]);
        }

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


}