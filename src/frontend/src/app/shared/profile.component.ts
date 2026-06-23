import { Component, EventEmitter, input, Output, QueryList, signal, ViewChild, ViewChildren } from "@angular/core";
import { DS } from '../tokens';
import { BtnComponent } from "./btn.component";
import { IconComponent } from "./icon.component";
import { FieldComponent } from "./field.component";
import { FieldType } from "./field.types";
import { HeaderComponent, HeaderConfig } from "./header.component";

export interface ProfileViewSettings{
  width:number,
  height:number
}

@Component({
  selector: 'app-profile',
  standalone: true,
  template: `
    <div class="profile-card">
      <app-header
      [config]="header()"
      />
      <div class="fields">
        @for (field of fields(); track field.label) {
          <app-field
            [field]="field"
            [isEditing]="isEditing()"
            (valueChanged)="onFieldChanged($event)"
          />
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
  imports: [BtnComponent, FieldComponent, HeaderComponent],
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
    header = input.required<HeaderConfig>();
    fields = input.required<FieldType[]>();
    @Output() fieldsChange = new EventEmitter<FieldType[]>();

    @ViewChild(IconComponent) iconComponent!: IconComponent;
    @ViewChildren(FieldComponent) fieldComponents!: QueryList<FieldComponent>

    isEditing = signal(false)

    onFieldChanged(event:FieldType){

    }

    startEdit(){
        this.isEditing.set(true);
    }

    cancelUpdate(){
        this.isEditing.set(false);
        this.iconComponent?.cancelUpload();
    }

    applyUpdates(){
        const updates = this.fieldComponents.map((fc)=>({
          ...fc.field(),
          value: fc.tempValue()
        } as FieldType));
        this.fieldsChange.emit(updates);
        this.isEditing.set(false);
    }

    onAvatarChanged(url: string) {
    //console.log('avatar changed:', url);
  }
    
}