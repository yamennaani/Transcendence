import { Component, input } from '@angular/core';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [NgStyle],
  template: `
    <div style="display:flex;align-items:center;gap:10px">
      <svg [attr.width]="size() * 1.1" [attr.height]="size()" viewBox="0 0 44 40" fill="none">
        <defs>
          <linearGradient id="lg" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stop-color="oklch(72% 0.28 296)"/>
            <stop offset="100%" stop-color="oklch(72% 0.15 200)"/>
          </linearGradient>
        </defs>
        <rect x="0" y="5" width="44" height="6" rx="3" fill="url(#lg)"/>
        <rect x="19" y="5" width="6" height="32" rx="3" fill="url(#lg)"/>
      </svg>
      <span [ngStyle]="wordmarkStyle()">43</span>
    </div>
  `,
})
export class LogoComponent {
  size = input<number>(24);

  wordmarkStyle = () => ({
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: '700',
    fontSize: `${this.size() * 0.9}px`,
    letterSpacing: '-0.03em',
    background: 'linear-gradient(90deg, oklch(72% 0.28 296), oklch(72% 0.15 200))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  });
}
