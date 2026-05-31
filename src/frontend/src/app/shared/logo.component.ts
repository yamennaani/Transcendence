import { Component, input } from '@angular/core';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [NgStyle],
  template: `
    <div style="display:flex;align-items:center;gap:10px">
      <span [ngStyle]="wordmarkStyle()">My Awesome Project</span>
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
