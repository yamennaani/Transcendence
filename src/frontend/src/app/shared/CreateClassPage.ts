import { Component, EventEmitter, inject, Output, signal } from "@angular/core";
import { DS } from "../tokens";
import { FieldType, SliderField } from "./field.types";
import { FieldComponent } from "./field.component";
import { TabListComponent, TabDirective } from "./tabs.component";
import { BtnComponent } from "./btn.component";
import { AuthService } from "../services/auth.service";
import { CourseService } from "../core/services/course-service/course-service";
import { LoadingService } from "../core/services/loading-service/loading.service";

@Component({
    selector: 'app-create-class',
    standalone: true,
    imports: [FieldComponent, TabListComponent, TabDirective, BtnComponent],
    template: `
        <div class="page">


            <div class="card">
                <div class="card-body">
                    <app-tab-list (tabChanged)="activeTab.set($event)">
                        <ng-template appTab label="Info"     icon="info" />
                        <ng-template appTab label="Settings" icon="tune" />
                    </app-tab-list>

                    <div class="fields-scroll">
                        @if (activeTab() === 0) {
                            <div class="fields">
                                @for (field of infoFields; track field.label) {
                                    <app-field [field]="field" [isEditing]="true"
                                        (valueChanged)="onFieldChanged($event)" />
                                }
                            </div>
                        }
                        @if (activeTab() === 1) {
                            <div class="fields">
                                @for (field of settingsFields; track field.label) {
                                    <app-field [field]="field" [isEditing]="true"
                                        (valueChanged)="onFieldChanged($event)" />
                                }
                                <div class="threshold-hint">
                                    Students must complete
                                    <strong>{{ getValue('Pass Threshold') }}%</strong>
                                    of assignments to pass this class.
                                </div>
                            </div>
                        }

                        @if (error()) {
                            <div class="error">{{ error() }}</div>
                        }
                    </div>
                </div>

                <div class="actions">
                    <app-btn variant="ghost"   size="lg" (clicked)="onCancel()">Cancel</app-btn>
                    <app-btn variant="primary" size="lg" (clicked)="onSave()">Create class</app-btn>
                </div>
            </div>

        </div>
    `,
    styles: [`
        .page {
            max-width: 560px;
            margin: 0 auto;
            padding: ${DS.space[6]};
            display: flex;
            flex-direction: column;
            gap: ${DS.space[4]};
        }
        .card {
            display: flex;
            flex-direction: column;
            height: 480px;
            background: ${DS.colors.surface};
            border: 1px solid ${DS.colors.border};
            border-radius: ${DS.radius.xl};
            overflow: hidden;
        }
        .card-body {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        .fields-scroll {
            flex: 1;
            overflow-y: auto;
            padding: ${DS.space[3]};
            display: flex;
            flex-direction: column;
            gap: ${DS.space[3]};
        }
        .fields {
            display: flex;
            flex-direction: column;
            gap: ${DS.space[3]};
        }
        .actions {
            flex-shrink: 0;
            display: flex;
            justify-content: flex-end;
            gap: ${DS.space[2]};
            padding: ${DS.space[3]} ${DS.space[4]};
            border-top: 1px solid ${DS.colors.borderSubtle};
            background: ${DS.colors.surface};
        }
        .error {
            font-size: 0.8125rem;
            color: ${DS.colors.red};
            background: ${DS.colors.redSubtle};
            border: 1px solid ${DS.colors.redBorder};
            border-radius: ${DS.radius.md};
            padding: ${DS.space[2]} ${DS.space[3]};
        }
        .threshold-hint {
            font-size: 0.8125rem;
            color: ${DS.colors.fg2};
            background: ${DS.colors.violetSubtle};
            border: 1px solid ${DS.colors.violetBorder};
            border-radius: ${DS.radius.md};
            padding: ${DS.space[2]} ${DS.space[3]};
        }
    `]
})
export class CreateClassPage {
    private auth    = inject(AuthService);
    private courses = inject(CourseService);
    private loading = inject(LoadingService);

    @Output() saved     = new EventEmitter<void>();
    @Output() cancelled = new EventEmitter<void>();

    activeTab = signal(0);
    error     = signal<string | null>(null);

    private changes = new Map<string, FieldType>();

    infoFields: FieldType[] = [
        { type: 'text',      label: 'Class Name',  icon: 'title',       required: true,  allowEdit: true, value: undefined },
        { type: 'text-area', label: 'Description', icon: 'description', required: true,  allowEdit: true, value: undefined },
    ];

    settingsFields: FieldType[] = [
        { type: 'slider', label: 'Pass Threshold', icon: 'leaderboard', required: true, allowEdit: true, value: 80, min: 50, max: 100 } as SliderField,
    ];

    onFieldChanged(field: FieldType) {
        this.changes.set(field.label, field);
    }

    getValue(label: string): any {
        const changed = this.changes.get(label);
        if (changed !== undefined) return changed.value;
        return [...this.infoFields, ...this.settingsFields].find(f => f.label === label)?.value;
    }

    onSave() {
        const name      = this.getValue('Class Name') as string | undefined;
        const desc      = this.getValue('Description') as string | undefined;
        const threshold = (this.getValue('Pass Threshold') as number | undefined) ?? 80;

        if (!name?.trim()) { this.error.set('Class name is required.'); return; }
        if (!desc?.trim()) { this.error.set('Description is required.'); return; }

        const user = this.auth.user();
        if (!user?.orgId) { this.error.set('Your account is not linked to an organization.'); return; }

        this.error.set(null);
        this.loading.show();
        this.courses.createClass({
            name:           name.trim(),
            description:    desc.trim(),
            pass_threshold: threshold,
            org_id:         user.orgId,
            created_by:     user.id,
        }).subscribe({
            next: () => {
                this.loading.hide();
                this.changes.clear();
                this.saved.emit();
            },
            error: (err) => {
                this.loading.hide();
                this.error.set(err?.error?.message ?? 'Failed to create class. Please try again.');
            },
        });
    }

    onCancel() {
        this.changes.clear();
        this.error.set(null);
        this.cancelled.emit();
    }
}
