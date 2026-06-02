import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { NgStyle } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Course, DS } from '../tokens';
import { BadgeComponent } from '../shared/badge.component';
import { ProgressBarComponent } from '../shared/progress-bar.component';
import { ScorePillComponent } from '../shared/score-pill.component';
import { CourseService } from '../core/services/course-service/course-service';
import { EnrollService } from '../core/services/enroll-service/enroll-service';
import { TranslateService } from '@ngx-translate/core';


const RECENT = [
  { title: 'Shell scripting basics', status: 'validated'   as const, score: 94,   max: 100 },
  { title: 'C memory management',   status: 'under_review' as const, score: null, max: 120 },
  { title: 'Makefile mastery',       status: 'submitted'   as const, score: null, max: 100 },
  { title: 'Pointers & structs',     status: 'validated'   as const, score: 78,   max: 100 },
];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgStyle, BadgeComponent, ProgressBarComponent, ScorePillComponent],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {

  private auth   = inject(AuthService);
  private router = inject(Router);
  private courseService = inject(CourseService);
  private enrollService = inject(EnrollService);
  private translate = inject(TranslateService);

  courses = signal<any[]>([])
  stats: any[] = [];
  
  firstName = computed(() => this.auth.user()?.username ?? 'there')
  user    = this.auth.user;
  recent  = RECENT;

  ngOnInit() {
    if (this.user()?.id) {
      this.getClasses();
    } else {
      this.auth.getMe().subscribe(() => this.getClasses());
    }
     // 👇 waits for translations to fully load before building stats
    this.translate.get('label_score_avg').subscribe(() => {
      this.stats = this.buildStats();
    });

    // rebuild on language change
    this.translate.onLangChange.subscribe(() => {
      this.stats = this.buildStats();
    });

  }

  private buildStats() {
    return [
      { label: this.translate.instant('label_score_avg'),         value: '88', unit: '/100', sub: this.translate.instant('sub_evaluations'), accent: false, warn: false },
      { label: this.translate.instant('label_progress'),          value: '6',  unit: '/10',  sub: this.translate.instant('sub_assignments'), accent: false, warn: false },
      { label: this.translate.instant('label_evaluations_given'), value: '12', unit: '',     sub: this.translate.instant('sub_month'),       accent: true,  warn: false },
      { label: this.translate.instant('label_pending_reviews'),   value: '2',  unit: '',     sub: this.translate.instant('sub_waiting'),     accent: false, warn: true  },
    ];
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
