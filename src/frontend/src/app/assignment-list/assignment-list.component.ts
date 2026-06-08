import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgStyle, SlicePipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { DS, BadgeVariant } from '../tokens';
import { AssignmentResponse } from '../core/services/course-service/Assignment.service';
import { EnrollService } from '../core/services/enroll-service/enroll-service';
import { SubmissionService } from '../core/services/submission-service/submission-service';
import { AuthService } from '../services/auth.service';
import { LoadingService } from '../core/services/loading-service/loading.service';
import { BadgeComponent } from '../shared/badge.component';
import { BtnComponent } from '../shared/btn.component';
import { ContainerComponent, ContainerConfig } from '../shared/container.component';

type AssignmentStatus = 'not_started' | 'in_progress' | 'awaiting_review' | 'failed' | 'passed';

interface AssignmentItem {
  assignment: AssignmentResponse;
  classId: number;
  className: string;
  status: AssignmentStatus;
}

const STATUS_META: Record<AssignmentStatus, { variant: BadgeVariant; label: string }> = {
  not_started:     { variant: 'pending',      label: 'Not started' },
  in_progress:     { variant: 'submitted',    label: 'In progress' },
  awaiting_review: { variant: 'under_review', label: 'Awaiting review' },
  failed:          { variant: 'failed',       label: 'Not passed yet' },
  passed:          { variant: 'validated',    label: 'Passed' },
};

@Component({
  selector: 'app-assignment-list',
  standalone: true,
  imports: [NgStyle, SlicePipe, BadgeComponent, BtnComponent, ContainerComponent],
  templateUrl: './assignment-list.component.html',
})
export class AssignmentListComponent implements OnInit {
  private router        = inject(Router);
  private route         = inject(ActivatedRoute);
  private enrollService = inject(EnrollService);
  private subService    = inject(SubmissionService);
  private auth          = inject(AuthService);
  private loading       = inject(LoadingService);

  classFilter = signal<number | null>(null);
  items       = signal<AssignmentItem[]>([]);
  loaded      = signal(false);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.classFilter.set(params['classId'] ? parseInt(params['classId'], 10) : null);
    });
    this.loadAssignments();
  }

  private loadAssignments() {
    const userId = this.auth.user()?.id;
    if (!userId) return;

    this.loading.show();
    this.enrollService.getStudenEnrolledClasses(userId).subscribe({
      next: (courses) => {
        const pairs = courses.flatMap(c =>
          (c.assignments ?? []).map(a => ({ classId: c.id, className: c.name, assignment: a as unknown as AssignmentResponse })));

        if (pairs.length === 0) {
          this.items.set([]);
          this.loaded.set(true);
          this.loading.hide();
          return;
        }

        forkJoin(pairs.map(p => this.subService.getSubmissionsForAssignment(p.assignment.id))).subscribe({
          next: (allSubs) => {
            this.items.set(pairs.map((p, i) => ({ ...p, status: this.statusFor(allSubs[i] ?? [], userId) })));
            this.loaded.set(true);
            this.loading.hide();
          },
          error: () => {
            this.items.set(pairs.map(p => ({ ...p, status: 'not_started' as AssignmentStatus })));
            this.loaded.set(true);
            this.loading.hide();
          },
        });
      },
      error: () => { this.loaded.set(true); this.loading.hide(); },
    });
  }

  private statusFor(subs: any[], userId: number): AssignmentStatus {
    const mine = subs.find(s => s.group?.members?.some((m: any) => m.userId === userId));
    if (!mine) return 'not_started';
    if (mine.status === 'Open') return 'in_progress';
    if (mine.passed === true) return 'passed';
    if (mine.passed === false) return 'failed';
    return 'awaiting_review';
  }

  // ── Derived view state ─────────────────────────────────────
  displayedItems = computed(() => {
    const classId = this.classFilter();
    const items = this.items();
    return classId ? items.filter(i => i.classId === classId) : items.filter(i => i.status !== 'passed');
  });

  filteredClassName = computed(() => {
    const classId = this.classFilter();
    if (!classId) return null;
    return this.items().find(i => i.classId === classId)?.className ?? null;
  });

  emptyMessage = computed(() =>
    this.classFilter()
      ? 'No assignments in this class yet.'
      : "You're all caught up — no assignments left to do.");

  statusMeta(status: AssignmentStatus) { return STATUS_META[status]; }

  open(item: AssignmentItem) {
    this.router.navigate(['/assignment-detail'], { queryParams: { assId: item.assignment.id } });
  }

  clearClassFilter() {
    this.router.navigate(['/assignment']);
  }

  // ── Styles ─────────────────────────────────────────────────
  readonly flatConfig: ContainerConfig = { variant: 'flat', height: 'auto', scrollable: false };

  readonly pageStyle     = { display: 'flex', flexDirection: 'column' as const, gap: '16px', padding: '32px', overflowY: 'auto' as const, flex: '1' };
  readonly overlineStyle = { fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: DS.colors.cyan, marginBottom: '6px' };
  readonly h1Style       = { fontFamily: DS.fonts.display, fontSize: '1.75rem', fontWeight: '700', letterSpacing: '-0.03em', color: DS.colors.fg1 };
  readonly crumbStyle    = { color: DS.colors.fg3, fontSize: '0.875rem', cursor: 'pointer', marginRight: '10px' };
  readonly emptyStyle    = { textAlign: 'center' as const, padding: '48px', color: DS.colors.fg3, fontSize: '0.9rem' };
  readonly gridStyle     = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' };

  readonly cardStyle     = { padding: '18px 20px', display: 'flex', flexDirection: 'column' as const, gap: '12px', height: '100%', boxSizing: 'border-box' as const };
  readonly cardTitleStyle = { fontFamily: DS.fonts.display, fontSize: '1.0625rem', fontWeight: '600', color: DS.colors.fg1 };
  readonly classNameStyle = { fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: DS.colors.violet };
  readonly descStyle      = { fontSize: '0.8125rem', color: DS.colors.fg2, lineHeight: '1.5', flex: '1' };
  readonly metaStyle      = { display: 'flex', flexWrap: 'wrap' as const, gap: '6px 14px', fontSize: '0.75rem', color: DS.colors.fg3 };
  readonly footerStyle    = { display: 'flex', justifyContent: 'space-between' as const, alignItems: 'center' as const, marginTop: 'auto' };
}