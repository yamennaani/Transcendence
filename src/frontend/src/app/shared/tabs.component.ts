import { 
    Component, ContentChildren, Directive, 
    EventEmitter, input, Output, QueryList, signal, computed
} from "@angular/core";
import { BtnComponent } from "./btn.component";
import { MatIcon } from "@angular/material/icon";
import { DS } from "../tokens";

export interface TabItem {
    label: string;
    icon?: string;
    count?: number;
}
@Directive({
    selector: 'ng-template[appTab]',
    standalone: true
})
export class TabDirective {
    label = input.required<string>();
    icon  = input<string>('');
    count = input<number | undefined>(undefined);
}

@Component({
    selector: 'app-tab-list',
    standalone: true,
    imports: [BtnComponent, MatIcon],
    template: `
        <nav class="tab-list">
            @for (tab of tabs; track tab.label(); let i = $index) {
                <app-btn
                    [variant]="selected() === i ? 'primary' : 'ghost'"
                    size="lg"
                    (clicked)="select(i)">
                    @if (tab.icon()) {
                        <mat-icon>{{ tab.icon() }}</mat-icon>
                    }
                    {{ tab.label() }}
                    @if (tab.count() !== undefined) {
                        <span class="badge">{{ tab.count() }}</span>
                    }
                </app-btn>
            }
        </nav>
    `,
    styles: [`
        .tab-list {
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            gap: ${DS.space[1]};
            padding: ${DS.space[2]} ${DS.space[3]};
        }
        .badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: ${DS.colors.violetDim};
            color: ${DS.colors.violet};
            border-radius: 999px;
            font-size: 0.7rem;
            font-weight: 600;
            min-width: 18px;
            height: 18px;
            padding: 0 5px;
            margin-left: ${DS.space[1]};
        }
    `]
})
export class TabListComponent {
    @ContentChildren(TabDirective) tabs!: QueryList<TabDirective>;
    @Output() tabChanged = new EventEmitter<number>();

    selected = signal(0);

    select(i: number) {
        this.selected.set(i);
        this.tabChanged.emit(i);
    }
}

@Component({
    selector: 'app-tab-panel',
    standalone: true,
    template: `<div class="panel"><ng-content /></div>`,
    styles: [`
        .panel {
            overflow-y: auto;
            box-sizing: border-box;
            padding: ${DS.space[3]};
        }
    `]
})
export class TabPanelComponent {
    height = input<number | 'auto'>('auto');
}