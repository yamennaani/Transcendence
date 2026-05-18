import { Component, computed, inject } from "@angular/core";
import { ProfileComponent, ProfileField, ProfileHeader } from "../shared/profile.component";
import { AuthService } from "../auth.service";

@Component({
    selector:'user-profile',
    standalone: true,
    imports: [ProfileComponent],
    template:`
    <app-profile
    [header]="getHeader()"
    [fields]="getFields()"
    (fieldsChange)=onFieldsUpdate($event)/>`
})
export class UserProfileComponent{
    private userAuth = inject(AuthService)
    private user = this.userAuth.user
    getHeader = computed<ProfileHeader>(() => ({
        name: this.user()?.username ?? '—',
        avatarIcon: 'person',
        bio: this.user()?.profile?.bio ?? '—'
        }))
    
    getFields = computed<ProfileField[]>(()=>[
        {
            icon:'email',
            label: 'Email',
            value: this.user()?.email,
            allowEdit: true
        },
        {
            icon:'badge',
            label: 'Role',
            value: this.user()?.role,
            allowEdit: false
        },
        {
            icon: 'person_book',
            label: 'Bio',
            value: this.user()?.profile?.bio,
            allowEdit: true
        },
        {
            icon: 'calendar_today',
            label: 'CreatedAt',
            value: this.user()?.created_at,
            allowEdit: false
        },
    ]);

    onFieldsUpdate(newFields:ProfileField[]){
        console.log('updated fields:', newFields);
    }
}