import { Component, inject, signal } from '@angular/core';
import { NgStyle } from '@angular/common';
import { Router } from '@angular/router';
import { DS } from '../tokens';
import { BadgeComponent } from '../shared/badge.component';
import { ProgressBarComponent } from '../shared/progress-bar.component';
import { BtnComponent } from '../shared/btn.component';

const CLASSES = [
  { id: 1, name: 'Systems programming',           done: 6, total: 10, threshold: 80, org: '43 Paris' },
  { id: 2, name: 'Algorithms & data structures',  done: 9, total: 10, threshold: 80, org: '43 Paris' },
  { id: 3, name: 'Web fundamentals',              done: 3, total: 8,  threshold: 80, org: '43 Paris' },
];

@Component({
  selector: 'app-class-list',
  standalone: true,
  imports: [NgStyle, BadgeComponent, ProgressBarComponent, BtnComponent],
  template: `
    <div [ngStyle]="pageStyle">
      <div style="margin-bottom:28px">
        <div [ngStyle]="overlineStyle">Enrolled</div>
        <h1 [ngStyle]="h1Style">My classes</h1>
      </div>

      <div style="display:flex;flex-direction:column;gap:14px;max-width:700px">
        @for (c of classes; track c.id) {
          <div [ngStyle]="cardStyle(c)"
               (mouseenter)="hovered.set(c.id)"
               (mouseleave)="hovered.set(0)"
               (click)="router.navigate(['/assignment'])">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px">
              <div>
                <div [ngStyle]="titleStyle">{{ c.name }}</div>
                <div [ngStyle]="metaStyle">{{ c.org }} · {{ c.total }} assignments · {{ c.threshold }}% threshold</div>
              </div>
              @if (passed(c)) {
                <app-badge variant="validated" customLabel="PASSED"/>
              }
            </div>
            <app-progress-bar [value]="c.done" [max]="c.total" [sublabel]="sublabel(c)"/>
          </div>
        }
      </div>
    </div>
  `,
})
export class ClassListComponent {
  router  = inject(Router);
  hovered = signal(0);
  classes = CLASSES;

  passed(c: typeof CLASSES[0]) { return (c.done / c.total) >= (c.threshold / 100); }

  sublabel(c: typeof CLASSES[0]) {
    return this.passed(c)
      ? 'Threshold met — class passed'
      : `${Math.ceil(c.total * c.threshold / 100) - c.done} more assignment(s) to reach ${c.threshold}% threshold`;
  }

  readonly pageStyle     = { flex: '1', overflowY: 'auto', padding: '32px' };
  readonly overlineStyle = { fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.12em', textTransform: 'uppercase', color: DS.colors.violet, marginBottom: '6px' };
  readonly h1Style       = { fontFamily: DS.fonts.display, fontSize: '2rem', fontWeight: '700', letterSpacing: '-0.03em', color: DS.colors.fg1 };
  readonly titleStyle    = { fontFamily: DS.fonts.display, fontSize: '1.125rem', fontWeight: '600', color: DS.colors.fg1, marginBottom: '3px' };
  readonly metaStyle     = { fontSize: '0.8125rem', color: DS.colors.fg3 };

  cardStyle(c: typeof CLASSES[0]) {
    const h = this.hovered() === c.id, p = this.passed(c);
    return {
      background: h ? DS.colors.surfaceRaised : DS.colors.surface,
      border: `1px solid ${p ? DS.colors.greenBorder : DS.colors.border}`,
      borderRadius: '14px', padding: '20px 22px', cursor: 'pointer', transition: 'all 150ms',
    };
  }
}
