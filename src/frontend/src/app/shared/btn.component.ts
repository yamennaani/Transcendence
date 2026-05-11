import { Component, input, output, signal, computed } from '@angular/core';
import { NgStyle } from '@angular/common';
import { DS } from '../tokens';

export type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type BtnSize    = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-btn',
  standalone: true,
  imports: [NgStyle],
  template: `
    <button
      [ngStyle]="styles()"
      [disabled]="disabled()"
      (click)="clicked.emit()"
      (mouseenter)="hovered.set(true)"
      (mouseleave)="hovered.set(false); pressed.set(false)"
      (mousedown)="pressed.set(true)"
      (mouseup)="pressed.set(false)"
    >
      <ng-content/>
    </button>
  `,
  styles: [`
    button { display: inline-flex; align-items: center; justify-content: center;
             gap: 6px; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif;
             font-weight: 500; transition: all 150ms cubic-bezier(0.4,0,0.2,1); }
    button:disabled { opacity: 0.38; pointer-events: none; }
  `],
})
export class BtnComponent {
  variant  = input<BtnVariant>('primary');
  size     = input<BtnSize>('md');
  disabled = input<boolean>(false);
  clicked  = output<void>();

  hovered = signal(false);
  pressed = signal(false);

  styles = computed(() => {
    const h = this.hovered(), p = this.pressed();
    const sizes: Record<BtnSize, object> = {
      sm: { padding: '5px 12px',  fontSize: '0.8125rem', borderRadius: '6px' },
      md: { padding: '9px 18px',  fontSize: '0.875rem',  borderRadius: '8px' },
      lg: { padding: '12px 24px', fontSize: '1rem',      borderRadius: '10px' },
    };
    const variants: Record<BtnVariant, object> = {
      primary:   { background: h ? DS.colors.violetDim : DS.colors.violet, color: '#fff', border: 'none' },
      secondary: { background: h ? 'oklch(27% 0.09 296)' : DS.colors.violetSubtle, color: DS.colors.violet, border: `1px solid ${DS.colors.violetBorder}` },
      ghost:     { background: h ? DS.colors.surfaceRaised : 'transparent', color: h ? DS.colors.fg1 : DS.colors.fg2, border: `1px solid ${DS.colors.border}` },
      danger:    { background: h ? 'oklch(22% 0.09 20)' : DS.colors.redSubtle, color: DS.colors.red, border: `1px solid ${DS.colors.redBorder}` },
    };
    return { ...sizes[this.size()], ...variants[this.variant()], transform: p ? 'scale(0.97)' : 'scale(1)' };
  });
}
