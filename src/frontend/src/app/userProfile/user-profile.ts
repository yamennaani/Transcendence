import { Component, computed, inject, signal, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { forkJoin } from "rxjs";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { AuthService } from "../services/auth.service";
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
    imports: [FieldComponent, ContainerComponent, BtnComponent, TranslateModule],
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

            @if (errorMsg()) {
                <div class="error-banner">{{ errorMsg() }}</div>
            }

            <div class="actions">
                @if (isEditing()) {
                    <app-btn variant="ghost"   size="lg" (clicked)="onCancel()">{{ 'btn_cancel' | translate }}</app-btn>
                    <app-btn variant="primary" size="lg" (clicked)="onSave()">{{ 'bocal_btn_save_changes' | translate }}</app-btn>
                } @else {
                    <app-btn variant="primary" size="lg" (clicked)="startEditing()">
                        {{ 'btn_edit_profile' | translate }}
                    </app-btn>
                }
            </div>

            <div class="legal-actions">
                <app-btn variant="ghost" size="sm" (clicked)="goToPrivacyPolicy()">{{ 'privacy_title' | translate }}</app-btn>
                <app-btn variant="ghost" size="sm" (clicked)="goToTermsOfService()">{{ 'terms_title' | translate }}</app-btn>
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
        .legal-actions {
            display: flex;
            justify-content: flex-end;
            gap: ${DS.space[2]};
            border-top: 1px solid ${DS.colors.borderSubtle};
            padding-top: ${DS.space[3]};
        }
        .error-banner {
            background: ${DS.colors.redSubtle};
            border: 1px solid ${DS.colors.redBorder};
            color: ${DS.colors.red};
            border-radius: ${DS.radius.md};
            padding: 10px 14px;
            font-size: 0.8125rem;
        }
    `]
})
export class UserProfileComponent implements OnInit {
    private userAuth    = inject(AuthService);
    private userService = inject(UserService);
    private loading     = inject(LoadingService);
    private router      = inject(Router);
    private translate    = inject(TranslateService);
    private user        = this.userAuth.user;

    isEditing = signal(false);
    errorMsg  = signal('');
    private changes = new Map<string, FieldType>();
    private files   = new Map<string, File>();

    readonly containerConfig: ContainerConfig = {
        variant:    'card',
        height:     'auto',
        scrollable: false,
    };

    ngOnInit() {
        if (!this.user()?.id) {
            this.userAuth.getMe().subscribe();
        }
    }

    fields = computed<FieldType[]>(() => [
        {
            type:         'icon',
            icon:         'image',
            label:        'label_avatar',
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
            label:     'label_username',
            value:     this.user()?.username,
            allowEdit: false,
            required:  true,
        },
        {
            type:      'text',
            icon:      'email',
            label:     'label_email',
            value:     this.user()?.email,
            allowEdit: false,
            required:  true,
        },
        {
            type:      'select',
            icon:      'badge',
            label:     'label_role',
            value:     this.user()?.role,
            options:   ['Admin', 'Student', 'Bocal'],
            allowEdit: false,
            required:  true,
        },
        {
            type:      'text-area',
            icon:      'edit_note',
            label:     'label_bio',
            value:     this.user()?.profile?.bio,
            allowEdit: true,
            required:  false,
        },
        {
            type:      'date',
            icon:      'calendar_today',
            label:     'label_member_since',
            value:     this.user()?.created_at,
            allowEdit: false,
            required:  false,
        },
        {
            type:      'date',
            icon:      'update',
            label:     'label_last_updated',
            value:     this.user()?.profile?.last_update,
            allowEdit: false,
            required:  false,
        },
    ]);

    startEditing() {
        this.changes.clear();
        this.files.clear();
        this.errorMsg.set('');
        this.isEditing.set(true);
    }

    onFieldChanged(field: FieldType) {
        this.changes.set(field.label, field);
    }

    onFileChosen(event: { label: string; file: File }) {
        this.files.set(event.label, event.file);
    }

    onSave() {
        const userId = this.user()?.id;
        if (!userId) {
            this.errorMsg.set(this.translate.instant('error_user_not_identified'));
            return;
        }

        const bioChange     = this.changes.get('label_bio');
        const avatarFile    = this.files.get('label_avatar');
        // Local base64 preview (set by FieldComponent via FileReader) — render
        // this immediately instead of the freshly-uploaded remote URL, which
        // would otherwise need a fresh network fetch before it appears.
        const avatarPreview = this.changes.get('label_avatar')?.value as string | undefined;

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

        this.errorMsg.set('');
        this.loading.show();
        forkJoin(calls).subscribe({
            next: (results: Record<string, any>) => {
                // Both endpoints return the upserted userProfile row (bio, avatar,
                // last_update) — merge whichever ones ran into the cached user.
                const profilePatch: Record<string, unknown> = {
                    ...results['bio'],
                    ...results['avatar'],
                };
                // Swap in the local preview so the new avatar renders instantly;
                // the real persisted URL will load next time /me is fetched.
                if (avatarPreview) profilePatch['avatar'] = avatarPreview;
                this.userAuth.updateUser({ profile: profilePatch as any });
                this.loading.hide();
                this.changes.clear();
                this.files.clear();
                this.isEditing.set(false);
            },
            error: (err) => {
                this.loading.hide();
                this.errorMsg.set(err?.error?.error ?? this.translate.instant('error_save_profile_failed'));
            },
        });
    }

    onCancel() {
        this.changes.clear();
        this.files.clear();
        this.errorMsg.set('');
        this.isEditing.set(false);
    }

    goToPrivacyPolicy() {
        this.router.navigate(['/privacy-policy']);
    }

    goToTermsOfService() {
        this.router.navigate(['/terms-of-service']);
    }
}
