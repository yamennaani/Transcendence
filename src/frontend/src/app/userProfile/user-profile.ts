import { Component, computed, inject, signal } from "@angular/core";
import { forkJoin } from "rxjs";
import { AuthService } from "../auth.service";
import { UserService } from "../core/services/user-service/user-service";
import { LoadingService } from "../core/services/loading-service/loading.service";
import { FieldType } from "../shared/field.types";
import { FieldComponent } from "../shared/field.component";
import { ContainerComponent, ContainerConfig } from "../shared/container.component";
import { BtnComponent } from "../shared/btn.component";
import { DS } from "../tokens";

@Component({
    selector: 'user-profile',
    standalone: true,
    imports: [FieldComponent, ContainerComponent, BtnComponent],
    template: `
        <div class="profile-page">
            <app-container [config]="containerConfig">
                <div class="fields">
                    @for (field of fields(); track field.label) {
                        <app-field
                            [field]="field"
                            [isEditing]="isEditing()"
                            (valueChanged)="onFieldChanged($event)"
                            (fileChosen)="onFileChosen($event)" />
                    }
                </div>
            </app-container>

            <div class="actions">
                @if (isEditing()) {
                    <app-btn variant="ghost"   size="lg" (clicked)="onCancel()">Cancel</app-btn>
                    <app-btn variant="primary" size="lg" (clicked)="onSave()">Save changes</app-btn>
                } @else {
                    <app-btn variant="primary" size="lg" (clicked)="isEditing.set(true)">
                        ✏️ Edit profile
                    </app-btn>
                }
            </div>

        </div>
    `,
    styles: [`
        .profile-page {
            max-width: 560px;
            margin: 0 auto;
            padding: ${DS.space[6]};
            display: flex;
            flex-direction: column;
            gap: ${DS.space[4]};
        }
        .fields {
            display: flex;
            flex-direction: column;
            gap: ${DS.space[3]};
            padding: ${DS.space[3]};
        }
        .actions {
            display: flex;
            justify-content: flex-end;
            gap: ${DS.space[2]};
        }
    `]
})
export class UserProfileComponent {
    private userAuth    = inject(AuthService);
    private userService = inject(UserService);
    private loading     = inject(LoadingService);
    private user        = this.userAuth.user;

    isEditing = signal(false);
    private changes = new Map<string, FieldType>();
    private files   = new Map<string, File>();

    readonly containerConfig: ContainerConfig = {
        variant:    'card',
        height:     'auto',
        scrollable: false,
    };

    fields = computed<FieldType[]>(() => [
        {
            type:         'icon',
            icon:         'image',
            label:        'Avatar',
            value:        this.user()?.profile?.avatar,
            iconSettings: {
                name:         this.user()?.username,
                icon:         this.user()?.profile?.avatar,
                size:         64,
                borderRadius: 50,
            },
            allowEdit: true,
            required:  false,
        },
        {
            type:      'text',
            icon:      'person',
            label:     'Username',
            value:     this.user()?.username,
            allowEdit: false,
            required:  true,
        },
        {
            type:      'text',
            icon:      'email',
            label:     'Email',
            value:     this.user()?.email,
            allowEdit: false,
            required:  true,
        },
        {
            type:      'select',
            icon:      'badge',
            label:     'Role',
            value:     this.user()?.role,
            options:   ['Admin', 'Student', 'Bocal'],
            allowEdit: false,
            required:  true,
        },
        {
            type:      'text-area',
            icon:      'edit_note',
            label:     'Bio',
            value:     this.user()?.profile?.bio,
            allowEdit: true,
            required:  false,
        },
        {
            type:      'date',
            icon:      'calendar_today',
            label:     'Member Since',
            value:     this.user()?.created_at,
            allowEdit: false,
            required:  false,
        },
        {
            type:      'date',
            icon:      'update',
            label:     'Last Updated',
            value:     this.user()?.profile?.last_update,
            allowEdit: false,
            required:  false,
        },
    ]);

    onFieldChanged(field: FieldType) {
        this.changes.set(field.label, field);
    }

    onFileChosen(event: { label: string; file: File }) {
        this.files.set(event.label, event.file);
    }

    onSave() {
        const userId = this.user()?.id;
        if (!userId) return;

        const bioChange    = this.changes.get('Bio');
        const avatarFile   = this.files.get('Avatar');
        const avatarPreview = this.changes.get('Avatar')?.value as string | undefined;

        const calls: Record<string, any> = {};
        if (bioChange !== undefined) {
            calls['bio'] = this.userService.updateProfile(userId, bioChange.value as string ?? '');
        }
        if (avatarFile) {
            calls['avatar'] = this.userService.uploadAvatar(userId, avatarFile);
        }

        if (Object.keys(calls).length === 0) {
            this.isEditing.set(false);
            return;
        }

        this.loading.show();
        forkJoin(calls).subscribe({
            next: () => {
                const profilePatch: Record<string, string> = {};
                if (bioChange !== undefined) profilePatch['bio'] = bioChange.value as string ?? '';
                if (avatarPreview)           profilePatch['avatar'] = avatarPreview;
                this.userAuth.updateUser({ profile: profilePatch as any });
                this.loading.hide();
                this.changes.clear();
                this.files.clear();
                this.isEditing.set(false);
            },
            error: () => this.loading.hide(),
        });
    }

    onCancel() {
        this.changes.clear();
        this.files.clear();
        this.isEditing.set(false);
    }
}
