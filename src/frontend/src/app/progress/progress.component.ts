import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { NgStyle } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { AuthService } from '../services/auth.service';
import { EnrollService } from '../core/services/enroll-service/enroll-service';
import { GroupService } from '../core/services/group-service/group-service';
import { SubmissionService } from '../core/services/submission-service/submission-service';
import { EvalService } from '../core/services/eval-service/eval-service';
import { DS } from '../tokens';

import { ListComponent } from '../shared/list.component';
import { BadgeComponent } from '../shared/badge.component';
import { ScorePillComponent } from '../shared/score-pill.component';
import { ProgressBarComponent } from '../shared/progress-bar.component';
import { BtnComponent } from '../shared/btn.component';

interface AssStatus {
  groupId: number | null;
  isSubmitted: boolean;
  finalScore: number | null;
  passed: boolean | null;
}

interface EvalRow {
  id: number;
  round: number;
  status: 'Pending' | 'Submitted' | 'Cancelled';
  evalResponseId: number | null;
}

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [NgStyle, ListComponent, BadgeComponent, ScorePillComponent, ProgressBarComponent, BtnComponent],
  template: `
    <div [ngStyle]="pageStyle">

      <!-- ── Classes view ────────────────────────────────────────── -->
      @if (view() === 'classes') {
        @if (loading()) {
          <div [ngStyle]="dimStyle">Loading classes…</div>
        } @else if (error()) {
          <div [ngStyle]="errorStyle">{{ error() }}</div>
        } @else {
          <app-list
            [items]="classes()"
            [trackBy]="trackById"
            title="Your progress"
            overline="Overview"
            emptyMessage="You are not enrolled in any classes."
            (rowClick)="onClassClick($event)"
          >
            <ng-template let-cls>
              <div [ngStyle]="classRowStyle">
                <div [ngStyle]="classRowHeaderStyle">
                  <span [ngStyle]="rowTitleStyle">{{ cls.name }}</span>
                  @if (statusLoading()) {
                    <span [ngStyle]="dimStyle">Loading…</span>
                  } @else {
                    <span [ngStyle]="progressTextStyle">
                      {{ classProgress(cls).submitted }} / {{ classProgress(cls).total }} submitted
                    </span>
                  }
                </div>
                @if (!statusLoading()) {
                  <app-progress-bar
                    [value]="classProgress(cls).submitted"
                    [max]="classProgress(cls).total || 1"
                  />
                }
              </div>
            </ng-template>
          </app-list>
        }
      }

      <!-- ── Assignments view ─────────────────────────────────────── -->
      @else if (view() === 'assignments') {
        <div [ngStyle]="headerStyle">
          <app-btn variant="ghost" size="sm" (clicked)="backToClasses()">← Classes</app-btn>
          <div>
            <div [ngStyle]="overlineStyle">Class</div>
            <h1 [ngStyle]="h1Style">{{ selectedClass()?.name }}</h1>
          </div>
        </div>

        @if (statusLoading()) {
          <div [ngStyle]="dimStyle">Loading assignments…</div>
        } @else {
          <app-list
            [items]="selectedAssignments()"
            [trackBy]="trackById"
            emptyMessage="No assignments in this class."
            (rowClick)="onAssignmentClick($event)"
          >
            <ng-template let-ass>
              <div [ngStyle]="assRowStyle">
                <div [ngStyle]="assInfoStyle">
                  <span [ngStyle]="rowTitleStyle">{{ ass.name }}</span>
                  @if (ass.description) {
                    <span [ngStyle]="rowMetaStyle">{{ ass.description }}</span>
                  }
                </div>
                <app-badge
                  [variant]="assStatus(ass.id)?.isSubmitted ? 'submitted' : 'pending'"
                  [customLabel]="assStatus(ass.id)?.isSubmitted ? 'Submitted' : 'Not submitted'"
                />
              </div>
            </ng-template>
          </app-list>
        }
      }

      <!-- ── Eval results view ────────────────────────────────────── -->
      @else if (view() === 'results') {
        <div [ngStyle]="headerStyle">
          <app-btn variant="ghost" size="sm" (clicked)="backToAssignments()">← {{ selectedClass()?.name }}</app-btn>
          <div>
            <div [ngStyle]="overlineStyle">Assignment</div>
            <h1 [ngStyle]="h1Style">{{ selectedAss()?.name }}</h1>
          </div>
        </div>

        @if (!hasSubmission()) {
          <div [ngStyle]="emptyPanelStyle">You haven't submitted this assignment yet.</div>
        } @else if (evalLoading()) {
          <div [ngStyle]="dimStyle">Loading evaluations…</div>
        } @else {

          @if (selectedStatus()?.finalScore != null) {
            <div [ngStyle]="scoreCardStyle">
              <span [ngStyle]="scoreLabelStyle">Final score</span>
              <div style="display:flex;align-items:center;gap:10px">
                <app-score-pill [score]="selectedStatus()!.finalScore!" [max]="100" />
                <app-badge [variant]="selectedStatus()!.passed ? 'validated' : 'failed'" />
              </div>
            </div>
          }

          <div [ngStyle]="panelStyle">
            <div [ngStyle]="panelTitleStyle">Evaluations received</div>
            @if (!evalRows() || evalRows()!.length === 0) {
              <div [ngStyle]="emptyStyle">No evaluations yet</div>
            } @else {
              @for (row of evalRows()!; track row.id; let last = $last) {
                <div [ngStyle]="evalRowStyle(last)">
                  <span [ngStyle]="roundStyle">Round {{ row.round }}</span>
                  <app-badge
                    [variant]="row.status === 'Submitted' ? 'submitted' : row.status === 'Cancelled' ? 'failed' : 'pending'"
                    [customLabel]="row.status"
                  />
                </div>
              }
            }
          </div>
        }
      }

    </div>
  `,
})
export class ProgressComponent implements OnInit {
  private auth = inject(AuthService);
  private enrollService = inject(EnrollService);
  private groupService = inject(GroupService);
  private submissionService = inject(SubmissionService);
  private evalService = inject(EvalService);

  view = signal<'classes' | 'assignments' | 'results'>('classes');

  classes            = signal<any[] | null>(null);
  selectedClass      = signal<any | null>(null);
  assignmentStatuses = signal<Record<number, AssStatus>>({});
  statusLoading      = signal(false);
  selectedAss        = signal<any | null>(null);
  evalRows           = signal<EvalRow[] | null>(null);
  evalLoading        = signal(false);
  loading            = signal(false);
  error              = signal<string | null>(null);

  readonly trackById = (item: { id: number }) => item.id;

  selectedAssignments = computed(() => this.selectedClass()?.assignments ?? []);

  selectedStatus = computed(() => {
    const ass = this.selectedAss();
    return ass ? (this.assignmentStatuses()[ass.id] ?? null) : null;
  });

  hasSubmission = computed(() => this.selectedStatus()?.isSubmitted ?? false);

  assStatus(assId: number): AssStatus | null {
    return this.assignmentStatuses()[assId] ?? null;
  }

  classProgress(cls: any): { submitted: number; total: number } {
    const assignments: any[] = cls.assignments ?? [];
    const total = assignments.length;
    const submitted = assignments.filter((a: any) => this.assignmentStatuses()[a.id]?.isSubmitted).length;
    return { submitted, total };
  }

  ngOnInit(): void {
    const userId = this.auth.user()?.id;
    if (!userId) return;

    this.loading.set(true);
    this.enrollService.getStudenEnrolledClasses(userId).subscribe({
      next: classes => {
        this.classes.set(classes);
        this.loading.set(false);
        this.loadAllStatuses(classes, userId);
      },
      error: () => {
        this.error.set('Failed to load your classes.');
        this.loading.set(false);
      },
    });
  }

  onClassClick(cls: any): void {
    this.selectedClass.set(cls);
    this.view.set('assignments');
  }

  backToClasses(): void {
    this.view.set('classes');
    this.selectedClass.set(null);
  }

  onAssignmentClick(ass: any): void {
    this.selectedAss.set(ass);
    this.view.set('results');
    const status = this.assStatus(ass.id);
    if (status?.groupId) {
      this.loadEvalResults(ass.id, status.groupId);
    } else {
      this.evalRows.set([]);
    }
  }

  backToAssignments(): void {
    this.view.set('assignments');
    this.selectedAss.set(null);
    this.evalRows.set(null);
  }

  private loadAllStatuses(classes: any[], userId: number): void {
    const allAssignments: any[] = classes.flatMap((cls: any) => cls.assignments ?? []);

    if (allAssignments.length === 0) return;

    this.statusLoading.set(true);

    const requests = allAssignments.map(ass =>
      this.groupService.getMyGroupForAssignment(userId, ass.id).pipe(
        catchError(() => of(null)),
        switchMap((group: any) => {
          if (!group) {
            return of({ assId: ass.id, groupId: null, isSubmitted: false, finalScore: null, passed: null });
          }
          return this.submissionService.getGroupSubmissions(group.id).pipe(
            catchError(() => of([])),
            map((subs: any) => {
              const list: any[] = Array.isArray(subs) ? subs : [];
              const closed = list.find((s: any) => s.status === 'Close');
              return {
                assId: ass.id,
                groupId: group.id,
                isSubmitted: !!closed,
                finalScore: closed?.finalScore ?? null,
                passed: closed?.passed ?? null,
              };
            })
          );
        })
      )
    );

    forkJoin(requests).subscribe({
      next: statuses => {
        const record: Record<number, AssStatus> = {};
        statuses.forEach((s: any) => { record[s.assId] = s; });
        this.assignmentStatuses.set(record);
        this.statusLoading.set(false);
      },
      error: () => this.statusLoading.set(false),
    });
  }

  private loadEvalResults(assId: number, groupId: number): void {
    this.evalLoading.set(true);
    this.evalService.getEvalAssignments(assId).subscribe({
      next: rows => {
        const myRows: EvalRow[] = rows
          .filter(r => r.evalueeGroupId === groupId)
          .map(r => ({
            id: r.id,
            round: r.round,
            status: r.status,
            evalResponseId: r.evalResponseId,
          }));
        this.evalRows.set(myRows);
        this.evalLoading.set(false);
      },
      error: () => {
        this.evalRows.set([]);
        this.evalLoading.set(false);
      },
    });
  }

  // ── Styles ─────────────────────────────────────────────────────────
  readonly pageStyle = {
    flex: '1', overflowY: 'auto', padding: '32px',
    display: 'flex', flexDirection: 'column' as const, gap: '24px',
  };
  readonly headerStyle = { display: 'flex', flexDirection: 'column' as const, gap: '16px' };
  readonly h1Style = {
    fontFamily: DS.fonts.display, fontSize: '2rem', fontWeight: '700',
    letterSpacing: '-0.03em', color: DS.colors.fg1, margin: '0',
  };
  readonly overlineStyle = {
    fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.12em',
    textTransform: 'uppercase' as const, color: DS.colors.violet, marginBottom: '4px',
  };
  readonly dimStyle        = { fontSize: '0.875rem', color: DS.colors.fg3 };
  readonly progressTextStyle = {
    fontFamily: DS.fonts.mono, fontSize: '0.75rem', color: DS.colors.fg3,
  };
  readonly errorStyle = {
    fontSize: '0.875rem', color: DS.colors.red,
    background: DS.colors.redSubtle, border: `1px solid ${DS.colors.redBorder}`,
    borderRadius: DS.radius.md, padding: '12px 16px',
  };
  readonly panelStyle = {
    background: DS.colors.surface, border: `1px solid ${DS.colors.border}`,
    borderRadius: DS.radius.lg, padding: '20px 22px',
    display: 'flex', flexDirection: 'column' as const, gap: '14px', maxWidth: '640px',
  };
  readonly panelTitleStyle = {
    fontFamily: DS.fonts.display, fontSize: '1rem', fontWeight: '600', color: DS.colors.fg1,
  };
  readonly scoreCardStyle = {
    background: DS.colors.surface, border: `1px solid ${DS.colors.border}`,
    borderRadius: DS.radius.lg, padding: '16px 22px',
    display: 'flex', flexDirection: 'row' as const,
    justifyContent: 'space-between', alignItems: 'center', maxWidth: '640px',
  };
  readonly scoreLabelStyle = {
    fontFamily: DS.fonts.display, fontSize: '0.9375rem', fontWeight: '600', color: DS.colors.fg2,
  };
  readonly emptyStyle      = { fontSize: '0.875rem', color: DS.colors.fg3 };
  readonly emptyPanelStyle = { fontSize: '0.9375rem', color: DS.colors.fg3, padding: '24px 0' };
  readonly classRowStyle = {
    padding: '14px 16px', display: 'flex', flexDirection: 'column' as const, gap: '10px',
  };
  readonly classRowHeaderStyle = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
  };
  readonly assRowStyle = {
    padding: '14px 16px', display: 'flex',
    justifyContent: 'space-between', alignItems: 'center', gap: '12px',
  };
  readonly assInfoStyle = {
    display: 'flex', flexDirection: 'column' as const, gap: '3px', flex: '1', minWidth: '0',
  };
  readonly rowTitleStyle = {
    fontFamily: DS.fonts.display, fontSize: '1rem', fontWeight: '600',
    color: DS.colors.fg1, whiteSpace: 'nowrap' as const,
    overflow: 'hidden', textOverflow: 'ellipsis',
  };
  readonly rowMetaStyle = {
    fontSize: '0.8125rem', color: DS.colors.fg3,
    whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis',
  };
  readonly roundStyle = { fontFamily: DS.fonts.mono, fontSize: '0.875rem', color: DS.colors.fg2 };

  evalRowStyle(last: boolean) {
    return {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      paddingBottom: last ? '0' : '10px',
      borderBottom: last ? 'none' : `1px solid ${DS.colors.borderSubtle}`,
    };
  }
}
