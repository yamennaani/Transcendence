import { Component, inject } from '@angular/core';
import { NgStyle } from '@angular/common';
import { AuthService } from '../auth.service';
import { DS } from '../tokens';
import { ProgressBarComponent } from '../shared/progress-bar.component';
import { ScorePillComponent } from '../shared/score-pill.component';
import { AvatarComponent } from '../shared/avatar.component';

const CLASSES = [
  { name: 'Systems programming',          done: 6, total: 10, threshold: 80 },
  { name: 'Algorithms & data structures', done: 9, total: 10, threshold: 80 },
  { name: 'Web fundamentals',             done: 3, total: 8,  threshold: 80 },
];

const EVALS = [
  { from: 'Sofia Reyes', assignment: 'Shell scripting basics', score: 94, date: '2026-04-20' },
  { from: 'Marcus K.',   assignment: 'C memory management',    score: 88, date: '2026-04-19' },
  { from: 'Jordan Lee',  assignment: 'Pointers & structs',     score: 78, date: '2026-04-15' },
];

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [NgStyle, ProgressBarComponent, ScorePillComponent],
  template: `
    <div [ngStyle]="pageStyle">
      <div style="margin-bottom:28px">
        <div [ngStyle]="overlineStyle">Overview</div>
        <h1 [ngStyle]="h1Style">Your progress</h1>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;max-width:800px">
        <!-- Class completion -->
        <div [ngStyle]="panelStyle">
          <div [ngStyle]="panelTitleStyle">Class completion</div>
          @for (c of classes; track c.name) {
            <app-progress-bar [value]="c.done" [max]="c.total" [label]="c.name"/>
          }
        </div>

        <!-- Evaluations received -->
        <div [ngStyle]="panelStyle">
          <div [ngStyle]="panelTitleStyle">Recent evaluations received</div>
          @for (ev of evals; track ev.assignment; let last = $last) {
            <div [ngStyle]="rowStyle(last)">
              <div>
                <div style="font-size:0.875rem;font-weight:500;color:oklch(94% 0.005 272)">{{ ev.assignment }}</div>
                <div style="font-size:0.75rem;color:oklch(48% 0.01 272)">by {{ ev.from }} · {{ ev.date }}</div>
              </div>
              <app-score-pill [score]="ev.score"/>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class ProgressComponent {
  auth    = inject(AuthService);
  classes = CLASSES;
  evals   = EVALS;

  readonly pageStyle      = { flex: '1', overflowY: 'auto', padding: '32px' };
  readonly overlineStyle  = { fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.12em', textTransform: 'uppercase', color: DS.colors.violet, marginBottom: '6px' };
  readonly h1Style        = { fontFamily: DS.fonts.display, fontSize: '2rem', fontWeight: '700', letterSpacing: '-0.03em', color: DS.colors.fg1 };
  readonly panelStyle     = { background: DS.colors.surface, border: `1px solid ${DS.colors.border}`, borderRadius: '12px', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '14px' };
  readonly panelTitleStyle= { fontFamily: DS.fonts.display, fontSize: '1rem', fontWeight: '600', color: DS.colors.fg1 };

  rowStyle(last: boolean) {
    return {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      paddingBottom: last ? '0' : '10px',
      borderBottom: last ? 'none' : `1px solid ${DS.colors.borderSubtle}`,
    };
  }
}
