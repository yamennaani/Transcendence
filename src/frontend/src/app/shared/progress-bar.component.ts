import { Component, input, computed } from '@angular/core';
import { NgStyle } from '@angular/common';
import { DS } from '../tokens';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [NgStyle],
  template: `
    <div style="display:flex;flex-direction:column;gap:6px">
      @if (label()) {
        <div style="display:flex;justify-content:space-between;align-items:baseline">
          <span [ngStyle]="{fontFamily:fonts.display,fontSize:'0.875rem',fontWeight:'500',color:fg1}">{{ label() }}</span>
          <span [ngStyle]="{fontFamily:fonts.mono,fontSize:'0.8125rem',color:fg2}">{{ value() }} / {{ max() }}</span>
        </div>
      }
      <div [ngStyle]="trackStyle">
        <div [ngStyle]="fillStyle()"></div>
      </div>
      @if (sublabel()) {
        <span [ngStyle]="{fontSize:'0.75rem',color:pct()>=80?green:fg3}">{{ sublabel() }}</span>
      }
    </div>
  `,
})
export class ProgressBarComponent {
  value    = input<number>(0);
  max      = input<number>(100);
  label    = input<string>('');
  sublabel = input<string>('');

  readonly fg1   = DS.colors.fg1;
  readonly fg2   = DS.colors.fg2;
  readonly fg3   = DS.colors.fg3;
  readonly green = DS.colors.green;
  readonly fonts = DS.fonts;

  readonly trackStyle = {
    height: '6px', background: 'oklch(22% 0.025 272)',
    borderRadius: '9999px', overflow: 'hidden',
  };

  pct = computed(() => Math.min(100, (this.value() / this.max()) * 100));

  fillStyle = computed(() => ({
    height: '100%',
    width: `${this.pct()}%`,
    background: this.pct() >= 80 ? DS.colors.green
               : this.pct() >= 50 ? DS.colors.violet
               : DS.colors.amber,
    borderRadius: '9999px',
    transition: 'width 400ms cubic-bezier(0,0,0.2,1)',
  }));
}
