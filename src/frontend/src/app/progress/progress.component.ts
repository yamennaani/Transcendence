import { Component, inject, signal, OnInit } from '@angular/core';
import { NgStyle } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { AuthService } from '../services/auth.service';
import { EnrollService } from '../core/services/enroll-service/enroll-service';
import { GroupService } from '../core/services/group-service/group-service';
import { SubmissionService } from '../core/services/submission-service/submission-service';
import { EvalService } from '../core/services/eval-service/eval-service';
import { DS } from '../tokens';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { BadgeComponent } from '../shared/badge.component';
import { ScorePillComponent } from '../shared/score-pill.component';
import { ProgressBarComponent } from '../shared/progress-bar.component';

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
  imports: [NgStyle, BadgeComponent, ScorePillComponent, ProgressBarComponent],
  template: `
    <div [ngStyle]="pageStyle">
      <div>
        <div [ngStyle]="overlineStyle">Overview</div>
        <h1 [ngStyle]="h1Style">Your progress</h1>
      </div>

      @if (loading()) {
        <div [ngStyle]="dimStyle">Loading classes…</div>
      } @else if (error()) {
        <div [ngStyle]="errorStyle">{{ error() }}</div>
      } @else if (!classes() || classes()!.length === 0) {
        <div [ngStyle]="dimStyle">You are not enrolled in any classes.</div>
      } @else {
        <div [ngStyle]="accordionWrapStyle">
          @for (cls of classes()!; track cls.id) {
            <div [ngStyle]="clsCardStyle">

              <!-- Class header -->
              <div class="row-clickable" [ngStyle]="clsHeaderStyle" (click)="toggleClass(cls.id)">
                <span [ngStyle]="chevronStyle">{{ expandedClassIds().has(cls.id) ? '▼' : '▶' }}</span>
                <div [ngStyle]="clsInfoStyle">
                  <div [ngStyle]="clsTopRowStyle">
                    <span [ngStyle]="rowTitleStyle">{{ cls.name }}</span>
                    @if (!statusLoading()) {
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
              </div>

              <!-- Assignments dropdown -->
              @if (expandedClassIds().has(cls.id)) {
                <div [ngStyle]="assAreaStyle">
                  @if (statusLoading()) {
                    <div [ngStyle]="paddedDimStyle">Loading assignments…</div>
                  } @else if (!cls.assignments || cls.assignments.length === 0) {
                    <div [ngStyle]="paddedDimStyle">No assignments in this class.</div>
                  } @else {
                    @for (ass of cls.assignments; track ass.id; let last = $last) {
                      <div [ngStyle]="assItemWrapStyle(last)">

                        <!-- Assignment header -->
                        <div class="row-clickable" [ngStyle]="assHeaderStyle" (click)="toggleAssignment(ass)">
                          <span [ngStyle]="chevronSmStyle">{{ expandedAssIds().has(ass.id) ? '▼' : '▶' }}</span>
                          <div [ngStyle]="assInfoStyle">
                            <span [ngStyle]="rowTitleStyle">{{ ass.name }}</span>
                            @if (ass.description) {
                              <span [ngStyle]="rowMetaStyle">{{ ass.description }}</span>
                            }
                          </div>
                          <app-badge
                            [variant]="assBadgeVariant(ass.id)"
                            [customLabel]="assBadgeLabel(ass.id)"
                          />
                        </div>

                        <!-- Eval results dropdown -->
                        @if (expandedAssIds().has(ass.id)) {
                          <div [ngStyle]="evalAreaStyle">
                            @if (!assStatus(ass.id)?.isSubmitted) {
                              <div [ngStyle]="dimStyle">You haven't submitted this assignment yet.</div>
                            } @else if (evalLoadingIds().has(ass.id)) {
                              <div [ngStyle]="dimStyle">Loading evaluations…</div>
                            } @else {
                              @if (assStatus(ass.id)?.finalScore != null) {
                                <div [ngStyle]="scoreRowStyle">
                                  <span [ngStyle]="scoreLabelStyle">Final score</span>
                                  <div style="display:flex;align-items:center;gap:10px">
                                    <app-score-pill [score]="assStatus(ass.id)!.finalScore!" [max]="100" />
                                    <app-badge [variant]="assStatus(ass.id)!.passed ? 'validated' : 'failed'" />
                                  </div>
                                </div>
                              }
                              @if (!evalRowsMap()[ass.id] || evalRowsMap()[ass.id].length === 0) {
                                <div [ngStyle]="dimStyle">No evaluations yet.</div>
                              } @else {
                                <div [ngStyle]="evalPanelStyle">
                                  <div [ngStyle]="panelTitleStyle">Evaluations received</div>
                                  @for (row of evalRowsMap()[ass.id]; track row.id; let last = $last) {
                                    <div [ngStyle]="evalRowItemStyle(last)">
                                      <span [ngStyle]="roundStyle">Round {{ row.round }}</span>
                                      <app-badge
                                        [variant]="row.status === 'Submitted' ? 'submitted' : row.status === 'Cancelled' ? 'failed' : 'pending'"
                                        [customLabel]="row.status === 'Submitted' ? 'badge_submitted' : row.status === 'Cancelled' ? 'badge_failed' : 'badge_pending'"
                                      />
                                    </div>
                                  }
                                </div>
                              }
                            }
                          </div>
                        }

                      </div>
                    }
                  }
                </div>
              }

            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .row-clickable { cursor: pointer; transition: background 100ms ease; }
    .row-clickable:hover { background: ${DS.colors.surfaceRaised}; }
  `],
})
export class ProgressComponent implements OnInit {
  private auth            = inject(AuthService);
  private enrollService   = inject(EnrollService);
  private groupService    = inject(GroupService);
  private submissionService = inject(SubmissionService);
  private evalService     = inject(EvalService);
  private translateService = inject(TranslateService);

  classes            = signal<any[] | null>(null);
  assignmentStatuses = signal<Record<number, AssStatus>>({});
  statusLoading      = signal(false);
  loading            = signal(false);
  error              = signal<string | null>(null);

  expandedClassIds = signal<Set<number>>(new Set());
  expandedAssIds   = signal<Set<number>>(new Set());
  evalRowsMap      = signal<Record<number, EvalRow[]>>({});
  evalLoadingIds   = signal<Set<number>>(new Set());

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
        this.error.set(this.translateService.instant('error_loading_classes'));
        this.loading.set(false);
      },
    });
  }

  toggleClass(classId: number): void {
    this.expandedClassIds.update(s => {
      const n = new Set(s);
      n.has(classId) ? n.delete(classId) : n.add(classId);
      return n;
    });
  }

  toggleAssignment(ass: any): void {
    const wasOpen = this.expandedAssIds().has(ass.id);
    this.expandedAssIds.update(s => {
      const n = new Set(s);
      wasOpen ? n.delete(ass.id) : n.add(ass.id);
      return n;
    });
    if (!wasOpen) {
      const status = this.assStatus(ass.id);
      if (status?.isSubmitted && status.groupId && !(ass.id in this.evalRowsMap())) {
        this.loadEvalResults(ass.id, status.groupId);
      }
    }
  }

  assStatus(assId: number): AssStatus | null {
    return this.assignmentStatuses()[assId] ?? null;
  }

  assBadgeVariant(assId: number) {
    const s = this.assStatus(assId);
    if (s?.finalScore != null) return s.passed ? 'validated' : 'failed';
    if (s?.isSubmitted) return 'submitted';
    return 'pending';
  }

  assBadgeLabel(assId: number): string {
    const s = this.assStatus(assId);
    if (s?.finalScore != null) return s.passed ? 'badge_passed' : 'badge_failed';
    if (s?.isSubmitted) return 'badge_submitted';
    return 'badge_pending';
  }

  classProgress(cls: any): { submitted: number; total: number } {
    const assignments: any[] = cls.assignments ?? [];
    const total = assignments.length;
    const submitted = assignments.filter((a: any) => this.assignmentStatuses()[a.id]?.isSubmitted).length;
    return { submitted, total };
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
    this.evalLoadingIds.update(s => { const n = new Set(s); n.add(assId); return n; });
    this.evalService.getEvalAssignments(assId).subscribe({
      next: rows => {
        const myRows: EvalRow[] = rows
          .filter((r: any) => r.evalueeGroupId === groupId)
          .map((r: any) => ({
            id: r.id,
            round: r.round,
            status: r.status,
            evalResponseId: r.evalResponseId,
          }));
        this.evalRowsMap.update(m => ({ ...m, [assId]: myRows }));
        this.evalLoadingIds.update(s => { const n = new Set(s); n.delete(assId); return n; });
      },
      error: () => {
        this.evalRowsMap.update(m => ({ ...m, [assId]: [] }));
        this.evalLoadingIds.update(s => { const n = new Set(s); n.delete(assId); return n; });
      },
    });
  }

  // ── Styles ─────────────────────────────────────────────────────────
  readonly pageStyle = {
    flex: '1', overflowY: 'auto', padding: '32px',
    display: 'flex', flexDirection: 'column' as const, gap: '24px',
  };
  readonly h1Style = {
    fontFamily: DS.fonts.display, fontSize: '2rem', fontWeight: '700',
    letterSpacing: '-0.03em', color: DS.colors.fg1, margin: '0',
  };
  readonly overlineStyle = {
    fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.12em',
    textTransform: 'uppercase' as const, color: DS.colors.violet, marginBottom: '4px',
  };
  readonly dimStyle       = { fontSize: '0.875rem', color: DS.colors.fg3 };
  readonly paddedDimStyle = { fontSize: '0.875rem', color: DS.colors.fg3, padding: '14px 18px' };
  readonly progressTextStyle = {
    fontFamily: DS.fonts.mono, fontSize: '0.75rem', color: DS.colors.fg3, flexShrink: '0' as const,
  };
  readonly errorStyle = {
    fontSize: '0.875rem', color: DS.colors.red,
    background: DS.colors.redSubtle, border: `1px solid ${DS.colors.redBorder}`,
    borderRadius: DS.radius.md, padding: '12px 16px',
  };
  readonly accordionWrapStyle = {
    display: 'flex', flexDirection: 'column' as const, gap: '12px',
  };
  readonly clsCardStyle = {
    background: DS.colors.surface, border: `1px solid ${DS.colors.border}`,
    borderRadius: DS.radius.xl, overflow: 'hidden',
  };
  readonly clsHeaderStyle = {
    display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 18px',
  };
  readonly clsInfoStyle = {
    flex: '1', display: 'flex', flexDirection: 'column' as const, gap: '8px', minWidth: '0',
  };
  readonly clsTopRowStyle = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
  };
  readonly chevronStyle = {
    fontSize: '0.75rem', color: DS.colors.fg3, flexShrink: '0' as const,
    width: '14px', userSelect: 'none' as const,
  };
  readonly chevronSmStyle = {
    fontSize: '0.625rem', color: DS.colors.fg3, flexShrink: '0' as const,
    width: '12px', userSelect: 'none' as const,
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
  readonly assAreaStyle = {
    borderTop: `1px solid ${DS.colors.border}`,
    display: 'flex', flexDirection: 'column' as const,
  };
  readonly assHeaderStyle = {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '12px 18px 12px 32px',
  };
  readonly assInfoStyle = {
    flex: '1', display: 'flex', flexDirection: 'column' as const, gap: '3px', minWidth: '0',
  };
  readonly evalAreaStyle = {
    padding: '14px 18px 14px 56px',
    borderTop: `1px solid ${DS.colors.borderSubtle}`,
    background: DS.colors.bg,
    display: 'flex', flexDirection: 'column' as const, gap: '12px',
  };
  readonly scoreRowStyle = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 14px', background: DS.colors.surface,
    border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.md,
  };
  readonly scoreLabelStyle = {
    fontFamily: DS.fonts.display, fontSize: '0.9375rem', fontWeight: '600', color: DS.colors.fg2,
  };
  readonly evalPanelStyle = {
    display: 'flex', flexDirection: 'column' as const, gap: '10px',
  };
  readonly panelTitleStyle = {
    fontFamily: DS.fonts.display, fontSize: '0.875rem', fontWeight: '600',
    color: DS.colors.fg2, marginBottom: '2px',
  };
  readonly roundStyle = { fontFamily: DS.fonts.mono, fontSize: '0.875rem', color: DS.colors.fg2 };

  assItemWrapStyle(last: boolean) {
    return {
      borderBottom: last ? 'none' : `1px solid ${DS.colors.borderSubtle}`,
    };
  }

  evalRowItemStyle(last: boolean) {
    return {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      paddingBottom: last ? '0' : '8px',
      borderBottom: last ? 'none' : `1px solid ${DS.colors.borderSubtle}`,
    };
  }
}
