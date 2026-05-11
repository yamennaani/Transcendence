import { Component, input, computed } from '@angular/core';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [NgStyle],
  template: `<div [ngStyle]="styles()">{{ initials() }}</div>`,
})
export class AvatarComponent {
  name = input<string>('');
  size = input<number>(32);

  initials = computed(() =>
    this.name().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  );

  private hue = computed(() =>
    this.name().split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  );

  styles = computed(() => {
    const h = this.hue(), s = this.size();
    return {
      width: `${s}px`, height: `${s}px`, borderRadius: '50%',
      background: `oklch(30% 0.12 ${h})`,
      border: `1px solid oklch(45% 0.12 ${h})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Space Grotesk', sans-serif", fontWeight: '600',
      fontSize: `${s * 0.35}px`, color: `oklch(80% 0.12 ${h})`,
      flexShrink: '0',
    };
  });
}
