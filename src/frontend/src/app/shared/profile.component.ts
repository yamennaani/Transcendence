import { Component, EventEmitter, input, Output, signal } from "@angular/core";
import { MatIcon } from "@angular/material/icon";
import { DS } from '../tokens';
import { BtnComponent } from "./btn.component";

export interface ProfileHeader{
    name:string,
    bio:string,
    avatarIcon:string
}

export interface ProfileField{
    icon:string,
    label:string,
    value: string | undefined,
    allowEdit: boolean
}

export interface ProfileViewSettings{
  width:number,
  height:number
}

@Component({
  selector: 'app-profile',
  standalone: true,
  template: `
    <div class="profile-card">

      <div class="avatar">
        <mat-icon>{{ header().avatarIcon }}</mat-icon>
      </div>

      <h2>{{ header().name }}</h2>

      <div class="fields">
        @for (item of fields(); track item.label) {
          <div class="field-row">
            <mat-icon>{{ item.icon }}</mat-icon>
            <span class="field-label">{{ item.label }}</span>
            @if (isEditing() && item.allowEdit) {
              <input [value]="tempFields()[$index].value" (input)="updateField($index, $event)" />
            } @else {
              <span class="field-value">{{ item.value || '—' }}</span>
            }
          </div>
        }
      </div>

      <div class="actions">
        @if (isEditing()) {
          <app-btn variant="secondary" size="lg" (clicked)="cancelUpdate()" style="width:100%">
            Cancel
          </app-btn>
          <app-btn variant="primary" size="lg" (clicked)="applyUpdates()" style="width:100%">
            Save
          </app-btn>
        } @else {
          <app-btn variant="primary" size="lg" (clicked)="startEdit()" style="width:100%">
            ✏️ Edit
          </app-btn>
        }
      </div>

    </div>
  `,
  imports: [MatIcon, BtnComponent],
  styles: [`
    .profile-card {
      max-width: 420px;
      padding: ${DS.space[8]};
      background: ${DS.colors.surface};
      border: 1px solid ${DS.colors.border};
      border-radius: ${DS.radius.xl};
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: ${DS.space[4]};
    }
    .avatar {
      width: 72px;
      height: 72px;
      border-radius: ${DS.radius.full};
      background: ${DS.colors.violetSubtle};
      border: 2px solid ${DS.colors.violetBorder};
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .avatar mat-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: ${DS.colors.violet};
    }
    h2 {
      font-family: ${DS.fonts.display};
      font-size: 1.5rem;
      font-weight: 700;
      color: ${DS.colors.fg1};
      margin: 0;
    }
    .fields {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: ${DS.space[3]};
      margin-top: ${DS.space[2]};
    }
    .field-row {
      display: flex;
      align-items: center;
      gap: ${DS.space[3]};
      padding: ${DS.space[3]};
      background: ${DS.colors.surfaceRaised};
      border: 1px solid ${DS.colors.borderSubtle};
      border-radius: ${DS.radius.md};
    }
    .field-row mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: ${DS.colors.fg3};
      flex-shrink: 0;
    }
    .field-label {
      font-size: 0.75rem;
      color: ${DS.colors.fg3};
      text-transform: uppercase;
      letter-spacing: 0.08em;
      min-width: 60px;
    }
    .field-value {
      font-size: 0.875rem;
      color: ${DS.colors.fg2};
      flex: 1;
    }
    input {
      flex: 1;
      background: ${DS.colors.bg};
      border: 1px solid ${DS.colors.violetBorder};
      border-radius: ${DS.radius.sm};
      color: ${DS.colors.fg1};
      font-size: 0.875rem;
      padding: 4px 8px;
      outline: none;
    }
    .actions {
      width: 100%;
      display: flex;
      gap: ${DS.space[2]};
      justify-content: flex-end;
      margin-top: ${DS.space[2]};
    }
    :host {
    display: flex;
    justify-content: center;  /* center — change to flex-start for left, flex-end for right */
    padding: 32px;
    }

    .profile-card {
    max-width: 600px;  /* increase this to make it wider */
    width: 100%;
    }
  `]
})
export class ProfileComponent{
    header = input.required<ProfileHeader>();
    fields = input.required<ProfileField[]>();
    @Output() fieldsChange = new EventEmitter<ProfileField[]>();

    isEditing = signal(false)
    tempFields = signal<ProfileField[]>([]);

    startEdit(){
        this.isEditing.set(true);
        this.tempFields.set(this.fields().map(f => ({ ...f })));
    }

    cancelUpdate(){
        this.isEditing.set(false);
        this.tempFields.set([])
    }

    applyUpdates(){
        this.fieldsChange.emit(this.tempFields());
        this.isEditing.set(false);
        this.tempFields.set([]);
    }

    updateField(index:number, event:Event){
        const newValue = (event.target as HTMLInputElement).value;
        this.tempFields.update(arr => {
        const newArr = arr.map(field => ({ ...field }));
        newArr[index].value = newValue;
        return newArr;})
    }
    
}