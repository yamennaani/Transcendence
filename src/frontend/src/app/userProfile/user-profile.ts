import { Component, computed, inject } from "@angular/core";
import { ProfileComponent, ProfileField, ProfileHeader } from "../shared/profile.component";
import { AuthService } from "../services/auth.service";
import { FieldType } from "../shared/field.types";

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
        avatarUrl: this.user()?.profile?.avatar,
        bio: this.user()?.profile?.bio ?? '—'
        }))
    
    getFields = computed<FieldType[]>(()=>[
        {
            type:'icon',
            icon:'',
            label:'',
            value: this.user()?.profile?.avatar,
            iconSettings:{
                name: this.user()?.username,
                icon: this.user()?.profile?.avatar,
                size: 80,
                borderRadius: 0,
            },
            allowEdit: true,
            required: false
        },
        {
            type: 'text',
            icon:'email',
            label: 'Email',
            value: this.user()?.email,
            allowEdit: true,
            required: true
        },
        {
            type: 'select',
            icon:'badge',
            label: 'Role',
            value: this.user()?.role,
            options: ['Admin', 'Student', 'Bocal'],
            allowEdit: true,
            required: true
        },
        {
            type: 'text',
            icon: 'person_book',
            label: 'Bio',
            value: this.user()?.profile?.bio,
            allowEdit: true,
            required: true
        },
        {
            type: 'date',
            icon: 'calendar_today',
            label: 'CreatedAt',
            value: this.user()?.created_at,
            allowEdit: false,
            required: true
        },
        {
            type: 'file',
            icon: 'calendar_today',
            label: 'CreatedAt',
            value: '',
            accept:['.image'],
            allowEdit: true,
            required: true
        },
    ]);

    onFieldsUpdate(newFields:FieldType[]){
        console.log('updated fields:', newFields);
    }
}