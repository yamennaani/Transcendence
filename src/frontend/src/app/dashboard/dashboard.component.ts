import { Component, inject, computed } from '@angular/core';
import { NgStyle } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { DS } from '../tokens';
import { BadgeComponent } from '../shared/badge.component';
import { ProgressBarComponent } from '../shared/progress-bar.component';
import { ScorePillComponent } from '../shared/score-pill.component';
import { BtnComponent } from '../shared/btn.component';

const STATS = [
  { label: 'Score avg',        value: '88', unit: '/100', sub: 'across 6 evaluations',  accent: false, warn: false },
  { label: 'Progress',         value: '6',  unit: '/10',  sub: 'assignments done',       accent: false, warn: false },
  { label: 'Evaluations given',value: '12', unit: '',     sub: 'this month',             accent: true,  warn: false },
  { label: 'Pending reviews',  value: '2',  unit: '',     sub: 'waiting for you',        accent: false, warn: true  },
];

const CLASSES = [
  { name: 'Systems programming',          done: 6, total: 10, threshold: 80 },
  { name: 'Algorithms & data structures', done: 9, total: 10, threshold: 80 },
  { name: 'Web fundamentals',             done: 3, total: 8,  threshold: 80 },
];

const RECENT = [
  { title: 'Shell scripting basics', status: 'validated'   as const, score: 94,   max: 100 },
  { title: 'C memory management',   status: 'under_review' as const, score: null, max: 120 },
  { title: 'Makefile mastery',       status: 'submitted'   as const, score: null, max: 100 },
  { title: 'Pointers & structs',     status: 'validated'   as const, score: 78,   max: 100 },
];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgStyle, BadgeComponent, ProgressBarComponent, ScorePillComponent, BtnComponent],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  private auth   = inject(AuthService);
  private router = inject(Router);
  firstName = computed(() => this.auth.user()?.name?.split(' ')[0] ?? 'there');

  user    = this.auth.user;
  stats   = STATS;
  classes = CLASSES;
  recent  = RECENT;

  sublabel(c: typeof CLASSES[0]) {
    const pct = Math.round((c.done / c.total) * 100);
    return pct >= c.threshold
      ? 'Passed — threshold met'
      : `Threshold: ${c.threshold}% · ${Math.ceil(c.total * c.threshold / 100) - c.done} more to pass`;
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

  statCardStyle(s: typeof STATS[0]) {
    return {
      background: DS.colors.surface,
      border: `1px solid ${s.accent ? DS.colors.violetBorder : s.warn ? DS.colors.amberBorder : DS.colors.border}`,
      borderRadius: '12px', padding: '18px 20px', flex: '1', minWidth: '120px',
      boxShadow: s.accent ? '0 0 24px oklch(64% 0.28 296 / 0.15)' : 'none',
    };
  }
  statLabelStyle(s: typeof STATS[0]) {
    return {
      fontSize: '0.6875rem', fontWeight: '600', letterSpacing: '0.1em',
      textTransform: 'uppercase', marginBottom: '6px',
      color: s.warn ? DS.colors.amber : DS.colors.violet,
    };
  }
  statNumStyle(s: typeof STATS[0]) {
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
