import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { NgStyle } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Course, DS, Assignment, BadgeVariant } from '../tokens';
import { BadgeComponent } from '../shared/badge.component';
import { TranslateModule } from '@ngx-translate/core';
import { ProgressBarComponent } from '../shared/progress-bar.component';
import { ScorePillComponent } from '../shared/score-pill.component';
import { CourseService } from '../core/services/course-service/course-service';
import { EnrollService } from '../core/services/enroll-service/enroll-service';
import { AssignmentService, AssignmentResponse } from '../core/services/course-service/Assignment.service';
import { SubmissionService } from '../core/services/submission-service/submission-service';
import { TranslateService } from '@ngx-translate/core';


// Recent assignments are now built from backend data via `recent()` signal

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgStyle, BadgeComponent, ProgressBarComponent, ScorePillComponent, TranslateModule],
  templateUrl: './dashboard.component.html',
})

export class DashboardComponent implements OnInit {

  private auth   = inject(AuthService);
  private router = inject(Router);
  private courseService = inject(CourseService);
  private enrollService = inject(EnrollService);
  private assignmentService = inject(AssignmentService);
  private subService = inject(SubmissionService);
  private translate = inject(TranslateService);

  courses = signal<Course[]>([])
  stats: any[] = [];
  
  recent = signal<Array<{ id: number; title: string; status: BadgeVariant; score: number | null; max: number; req_eval?: number; created_at?: string }>>([]);
  pendingCount = signal<number>(0);

  firstName = computed(() => this.auth.user()?.username ?? 'there')
  user    = this.auth.user;

  ngOnInit() {
    if (this.user()?.id) {
      this.getClasses();
    } else {
      this.auth.getMe().subscribe(() => this.getClasses());
    }
    
    this.translate.get('label_score_avg').subscribe(() => {
      this.stats = this.buildStats();
    });

    // rebuild on language change
    this.translate.onLangChange.subscribe(() => {
      this.stats = this.buildStats();
    });

  }

  private buildStats() {
    const courses = this.courses() ?? [];

    const totalAssignments = courses.reduce((acc, c) => acc + (c.assignments?.length ?? 0), 0);
    const completed = courses.reduce((acc, c) => acc + (c.done ?? 0), 0);

    const avgCompletion = totalAssignments === 0 ? 0 : Math.round((completed / totalAssignments) * 100);

    let evaluationsGiven = 0;
    let pendingReviews = 0;
    courses.forEach(c => {
      (c.assignments ?? []).forEach((a: any) => {
        evaluationsGiven += (a.req_eval ?? a.reqEval ?? 0);
        if (a.requiresStaffReview) pendingReviews += 1;
      });
    });
    
    // update pending count signal for use in templates
    this.pendingCount.set(pendingReviews);

    return [
      { label: this.translate.instant('label_score_avg'),         value: `${avgCompletion}`, unit: '/100', sub: this.translate.instant('sub_evaluations'), accent: false, warn: false },
      { label: this.translate.instant('label_progress'),          value: `${completed}`,  unit: `/${totalAssignments}`,  sub: this.translate.instant('sub_assignments'), accent: false, warn: false },
      { label: this.translate.instant('label_evaluations_given'), value: `${evaluationsGiven}`, unit: '',     sub: this.translate.instant('sub_month'),       accent: true,  warn: false },
      { label: this.translate.instant('label_pending_reviews'),   value: `${pendingReviews}`,  unit: '',     sub: this.translate.instant('sub_waiting'),     accent: false, warn: pendingReviews > 0 },
    ];
  }

  private buildRecent() {
    const courses = this.courses() ?? [];
    const items: Array<{ id: number; title: string; status: BadgeVariant; score: number | null; max: number; req_eval?: number; created_at?: string }> = [];
    courses.forEach(c => {
      (c.assignments ?? []).forEach((a: any) => {
        const status: BadgeVariant = a.requiresStaffReview ? 'under_review' : (a.submissionsCount && a.submissionsCount > 0 ? 'submitted' : 'pending');
        items.push({ id: a.id, title: a.name, status, score: null, max: (a.max_score ?? a.maxScore ?? 0), req_eval: (a.req_eval ?? a.reqEval ?? 0), created_at: a.created_at });
      });
    });

    // sort by created_at if available, otherwise keep insertion order
    items.sort((x, y) => {
      if (!x.created_at || !y.created_at) return 0;
      return new Date(y.created_at).getTime() - new Date(x.created_at).getTime();
    });

    const slice = items.slice(0, 5);
    this.recent.set(slice);

    // Enrich recent items with real submission data (scores/status) per assignment
    const userId = this.user()?.id;
    slice.forEach(item => {
      this.subService.getSubmissionsForAssignment(item.id).subscribe({
        next: (subs: any[]) => {
          if (!subs || subs.length === 0) return;
          // find user's submission (group member) if userId is available
          let mine: any = null;
          if (userId) {
            mine = subs.find(s => s.group?.members?.some((m: any) => m.userId === userId));
          }

          if (mine) {
            // determine status similar to assignment-detail
            let st: BadgeVariant = 'pending';
            if (mine.status === 'Close' && (mine.responses?.length ?? 0) >= (item.req_eval ?? 1)) {
              st = mine.passed ? 'validated' : 'failed';
            } else if (mine.status === 'Close') {
              st = 'under_review';
            } else {
              st = 'submitted';
            }

            // update the item in the recent signal
            const updated = (this.recent() ?? []).map(r => r.id === item.id ? { ...r, status: st, score: (mine.finalScore ?? null) } : r);
            this.recent.set(updated);
          } else {
            // no user's submission; optionally compute aggregated score or leave as pending
            const hasClosed = subs.some(s => s.status === 'Close');
            const updated = (this.recent() ?? []).map(r => r.id === item.id ? { ...r, status: hasClosed ? 'under_review' : r.status } : r);
            this.recent.set(updated);
          }
        },
        error: () => {},
      });
    });
  }

  goToAssignmentDetail(assId: number) {
    this.router.navigate(['/assignment-detail'], { queryParams: { assId } });
  }

  

  getClasses(){
    const user = this.user()
    if(!user || !user.id)
    {
        console.log('User not available yet');
        return;
    }
    const id = user.id;
    this.enrollService.getStudenEnrolledClasses(id).subscribe({
      next:(result)=>{
        this.courses.set(result);
        this.courseService.setUserCourses(result);

        // If courses come without assignment lists, fetch per-class assignments
        result.forEach((c: any) => {
          if (!c.assignments || c.assignments.length === 0) {
            this.assignmentService.getAssignments(c.id).subscribe({
              next: (assigns) => {
                const updated = (this.courses() ?? []).slice();
                const idx = updated.findIndex(x => x.id === c.id);
                if (idx >= 0) {
                  updated[idx] = { ...updated[idx], assignments: assigns as unknown as Assignment[] } as Course;
                  this.courses.set(updated);
                  this.courseService.setUserCourses(updated);
                  this.stats = this.buildStats();
                  this.buildRecent();
                }
              },
              error: () => {}
            });
          }
        });

        // initial build
        this.stats = this.buildStats();
        this.buildRecent();
      },
      error: (err)=>{
        console.log(err.error)
      }
    })
  }

  sublabel(c: Course) {
    const pct = Math.round((c.done / c.assignments?.length) * 100);
    return pct >= c.pass_threshold
      ? 'Passed — threshold met'
      : `Threshold: ${c.pass_threshold}% · ${Math.ceil(c.assignments?.length * c.pass_threshold / 100) - c.done} more to pass`;
  }

  goToAssignment() { this.router.navigate(['/assignment']); }
  goToClasses()    { this.router.navigate(['/classes']); }

  // ── Styles ──────────────────────────────────────────────────
  readonly pageStyle   = { flex: '1', overflowY: 'auto', padding: '32px' };
  readonly overlineStyle = { fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.12em', textTransform: 'uppercase', color: DS.colors.violet, marginBottom: '6px' };
  readonly h1Style = { fontFamily: DS.fonts.display, fontSize: '2rem', fontWeight: '700', letterSpacing: '-0.03em', color: DS.colors.fg1, lineHeight: '1.1' };
  readonly subtitleStyle = { fontSize: '0.9375rem', color: DS.colors.fg2, marginTop: '6px' };
  readonly statsRowStyle = { display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '28px', marginTop: '28px' };
  readonly gridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' };
  readonly sectionPanelStyle = { background: DS.colors.surface, border: `1px solid ${DS.colors.border}`, borderRadius: '12px', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '14px' };
  readonly linkStyle = { fontSize: '0.8125rem', color: DS.colors.violet, cursor: 'pointer' };

  statCardStyle(s: any) {
    return {
      background: DS.colors.surface,
      border: `1px solid ${s.accent ? DS.colors.violetBorder : s.warn ? DS.colors.amberBorder : DS.colors.border}`,
      borderRadius: '12px', padding: '18px 20px', flex: '1', minWidth: '120px',
      boxShadow: s.accent ? '0 0 24px oklch(64% 0.28 296 / 0.15)' : 'none',
    };
  }
  statLabelStyle(s: any) {
    return {
      fontSize: '0.6875rem', fontWeight: '600', letterSpacing: '0.1em',
      textTransform: 'uppercase', marginBottom: '6px',
      color: s.warn ? DS.colors.amber : DS.colors.violet,
    };
  }
  statNumStyle(s: any) {
    return {
      fontFamily: DS.fonts.display, fontWeight: '700', lineHeight: '1', letterSpacing: '-0.03em', fontSize: '2.25rem',
      background: s.accent ? 'linear-gradient(90deg,oklch(72% 0.28 296),oklch(72% 0.15 200))' : 'none',
      WebkitBackgroundClip: s.accent ? 'text' : 'unset',
      WebkitTextFillColor: s.accent ? 'transparent' : s.warn ? DS.colors.amber : DS.colors.fg1,
      backgroundClip: s.accent ? 'text' : 'unset',
    };
  }

  rowHovered: string | null = null;
  rowStyle(title: string) {
    const h = this.rowHovered === title;
    return {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
      padding: '13px 18px', borderRadius: '10px', cursor: 'pointer',
      background: h ? DS.colors.surfaceRaised : DS.colors.surface,
      border: `1px solid ${h ? DS.colors.border : DS.colors.borderSubtle}`,
      transition: 'all 150ms',
    };
  }
}
