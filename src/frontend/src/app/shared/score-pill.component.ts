import { Component, input, computed } from '@angular/core';
import { NgStyle } from '@angular/common';
import { DS } from '../tokens';

@Component({
  selector: 'app-score-pill',
  standalone: true,
  imports: [NgStyle],
  template: `<span [ngStyle]="styles()">{{ score() }} / {{ max() }}</span>`,
  styles: [`
    span { font-family: 'JetBrains Mono', monospace; font-size: 0.8125rem;
           font-weight: 500; padding: 3px 10px; border-radius: 9999px; }
  `],
})
export class ScorePillComponent {
  score = input<number>(0);
  max   = input<number>(100);

  styles = computed(() => {
    const pct = this.score() / this.max();
    return pct >= 1
      ? { background: DS.colors.violetSubtle, color: DS.colors.violet }
      : pct >= 0.6
      ? { background: DS.colors.greenSubtle,  color: DS.colors.green }
      : { background: DS.colors.redSubtle,    color: DS.colors.red };
  });
}
