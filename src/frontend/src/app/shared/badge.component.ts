import { Component, input, computed } from '@angular/core';
import { NgStyle } from '@angular/common';
import { BadgeVariant, BADGE_STYLES, BADGE_LABELS } from '../tokens';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [NgStyle],
  template: `
    <span [ngStyle]="styles()">
      <span [ngStyle]="dotStyle()"></span>
      {{ label() }}
    </span>
  `,
  styles: [`
    span { display: inline-flex; align-items: center; gap: 5px;
           font-family: 'JetBrains Mono', monospace; font-size: 0.6875rem;
           font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
           padding: 2px 8px; border-radius: 4px; }
  `],
})
export class BadgeComponent {
  variant = input<BadgeVariant>('pending');
  customLabel = input<string>('');

  private s = computed(() => BADGE_STYLES[this.variant()]);

  styles = computed(() => ({
    background: this.s().bg,
    color:      this.s().color,
    border:     `1px solid ${this.s().border}`,
  }));

  dotStyle = computed(() => ({
    width: '5px', height: '5px', borderRadius: '50%',
    background: this.s().color, flexShrink: '0',
  }));

  label = computed(() => this.customLabel() || BADGE_LABELS[this.variant()]);
}
