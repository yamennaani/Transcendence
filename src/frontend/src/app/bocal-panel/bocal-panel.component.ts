import { Component, inject, signal } from '@angular/core';
import { NgStyle } from '@angular/common';
import { Router } from '@angular/router';
import { DS } from '../tokens';
import { ProgressBarComponent } from '../shared/progress-bar.component';
import { ScorePillComponent } from '../shared/score-pill.component';
import { AvatarComponent } from '../shared/avatar.component';
import { BtnComponent } from '../shared/btn.component';

const BOCAL_CLASSES = [
  { id: 1, name: 'Systems programming',          students: 24, assignments: 10, threshold: 80, onTrack: 15, status: 'active' },
  { id: 2, name: 'Algorithms & data structures', students: 18, assignments: 10, threshold: 80, onTrack: 12, status: 'active' },
  { id: 3, name: 'Web fundamentals',             students: 31, assignments: 8,  threshold: 80, onTrack: 14, status: 'draft' },
];

const STUDENTS = [
  { name: 'Alex Martin',  cls: 'Systems',    prog: 6, total: 10, score: 88 },
  { name: 'Jordan Lee',   cls: 'Systems',    prog: 8, total: 10, score: 91 },
  { name: 'Sofia Reyes',  cls: 'Algorithms', prog: 9, total: 10, score: 95 },
  { name: 'Marcus K.',    cls: 'Algorithms', prog: 5, total: 10, score: 72 },
  { name: 'Chen Wei',     cls: 'Web',        prog: 3, total: 8,  score: 84 },
];

const ANALYTICS = [
  { label: 'Completion rate',              value: '74%', sub: 'avg across all classes',       color: DS.colors.violet },
  { label: 'Avg evaluations/submission',   value: '2.8', sub: 'target: 3.0',                  color: DS.colors.cyan   },
  { label: 'Pass rate',                    value: '61%', sub: 'students hitting threshold',    color: DS.colors.green  },
  { label: 'Pending evaluations',          value: '18',  sub: 'across all assignments',        color: DS.colors.amber  },
];

@Component({
  selector: 'app-bocal-panel',
  standalone: true,
  imports: [NgStyle, ProgressBarComponent, ScorePillComponent, AvatarComponent, BtnComponent],
  templateUrl: './bocal-panel.component.html',
})
export class BocalPanelComponent {
  router   = inject(Router);
  tab      = signal<'classes' | 'students' | 'analytics'>('classes');
  showNew  = signal(false);
  newName  = signal('');
  newThreshold = signal('80');

  classes   = BOCAL_CLASSES;
  students  = STUDENTS;
  analytics = ANALYTICS;
  thresholdOpts = ['60', '70', '80', '90', '100'];

  tabStyle(id: string) {
    const active = this.tab() === id;
    return {
      fontFamily: DS.fonts.body, fontSize: '0.875rem', fontWeight: '500',
      padding: '8px 16px', border: 'none', cursor: 'pointer', borderRadius: '6px',
      background: active ? DS.colors.violetSubtle : 'transparent',
      color:      active ? DS.colors.violet : DS.colors.fg2, transition: 'all 150ms',
    };
  }

  threshTabStyle(v: string) {
    const active = this.newThreshold() === v;
    return {
      padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontFamily: DS.fonts.body,
      fontSize: '0.875rem', transition: 'all 150ms',
      background: active ? DS.colors.violetSubtle : DS.colors.surfaceRaised,
      color:      active ? DS.colors.violet : DS.colors.fg2,
      border:     `1px solid ${active ? DS.colors.violetBorder : DS.colors.border}`,
    };
  }

  statusBadgeStyle(status: string) {
    const active = status === 'active';
    return {
      fontSize: '0.6875rem', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase',
      padding: '2px 8px', borderRadius: '9999px',
      background: active ? DS.colors.greenSubtle  : DS.colors.surfaceRaised,
      color:      active ? DS.colors.green : DS.colors.fg3,
      border:     `1px solid ${active ? DS.colors.greenBorder : DS.colors.border}`,
    };
  }

  readonly pageStyle    = { flex: '1', overflowY: 'auto', padding: '32px' };
  readonly overlineStyle= { fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.12em', textTransform: 'uppercase', color: DS.colors.cyan, marginBottom: '6px' };
  readonly h1Style      = { fontFamily: DS.fonts.display, fontSize: '1.75rem', fontWeight: '700', letterSpacing: '-0.03em', color: DS.colors.fg1 };
  readonly tabBarStyle  = { display: 'flex', gap: '4px', marginBottom: '20px', background: DS.colors.surface, borderRadius: '8px', padding: '4px', width: 'fit-content', border: `1px solid ${DS.colors.borderSubtle}` };
  readonly cardStyle    = { background: DS.colors.surface, border: `1px solid ${DS.colors.border}`, borderRadius: '12px', padding: '18px 20px' };
  readonly overlayStyle = { position: 'fixed', inset: '0', background: 'oklch(0% 0 0 / 0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: '100' };
  readonly modalStyle   = { background: DS.colors.surface, border: `1px solid ${DS.colors.border}`, borderRadius: '16px', padding: '28px', width: '440px', boxShadow: '0 8px 32px oklch(0% 0 0 / 0.8)' };
  readonly tableStyle   = { background: DS.colors.surface, border: `1px solid ${DS.colors.border}`, borderRadius: '12px', overflow: 'hidden' };
  readonly thStyle      = { padding: '10px 16px', fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', color: DS.colors.fg3, borderBottom: `1px solid ${DS.colors.border}` };
  readonly tdStyle      = { padding: '12px 16px', borderBottom: `1px solid ${DS.colors.borderSubtle}`, fontSize: '0.875rem', color: DS.colors.fg2, display: 'flex', alignItems: 'center' };
  readonly inputStyle   = { background: DS.colors.surfaceRaised, border: `1px solid ${DS.colors.border}`, borderRadius: '8px', padding: '9px 14px', fontSize: '0.875rem', fontFamily: DS.fonts.body, color: DS.colors.fg1, outline: 'none', width: '100%' };
  readonly labelStyle   = { fontSize: '0.8125rem', fontWeight: '500', color: DS.colors.fg2, display: 'block', marginBottom: '6px' };
}
