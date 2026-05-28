import { Component, computed, input } from "@angular/core";
import { NgStyle } from "@angular/common";
import { DS } from "../tokens";

export interface ContainerConfig {
    variant: 'card' | 'flat' | 'inset';
    height: number | 'auto';
    scrollable: boolean;
}

@Component({
    selector: 'app-container',
    standalone: true,
    imports: [NgStyle],
    template: `
        <div [ngStyle]="style()">
            <ng-content />
        </div>
    `
})
export class ContainerComponent {
    config = input.required<ContainerConfig>();

    style = computed(() => {
        const { variant, height, scrollable } = this.config();

        const variants = {
            card: {
                background: DS.colors.surfaceRaised,
                border: `1px solid ${DS.colors.borderSubtle}`,
                borderRadius: DS.radius.md,
                boxShadow: `0 2px 8px rgba(0,0,0,0.18), 0 1px 2px rgba(0,0,0,0.12)`,
            },
            flat: {
                background: DS.colors.surface,
                border: `1px solid ${DS.colors.border}`,
                borderRadius: DS.radius.md,
                boxShadow: 'none',
            },
            inset: {
                background: DS.colors.bg,
                border: `1px solid ${DS.colors.borderSubtle}`,
                borderRadius: DS.radius.md,
                boxShadow: `inset 0 2px 6px rgba(0,0,0,0.2)`,
            }
        };

        return {
            ...variants[variant],
            height: height === 'auto' ? 'auto' : `${height}px`,
            overflow: scrollable ? 'auto' : 'hidden',
            boxSizing: 'border-box',
        };
    });
}