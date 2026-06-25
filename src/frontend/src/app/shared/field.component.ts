import { Component, computed, effect, EventEmitter, input, Output, signal } from "@angular/core";
import { FieldType, FieldValue, FileField, IconField, SelectField, SliderField } from "./field.types";
import { DS } from "../tokens";
import { MatIcon } from "@angular/material/icon";
import { TranslateModule } from "@ngx-translate/core";
import { IconComponent } from "./icon.component";

@Component({
    selector: "app-field",
    standalone: true,
    imports:[MatIcon, IconComponent, TranslateModule],
    template:`
    <div class="field-row">
        <div class="field-meta">
            <mat-icon>{{ field().icon }}</mat-icon>
            <span class="field-label">
            {{ field().label | translate }}
            @if (field().required && canEdit()) { <span class="required">*</span> }
            </span>
        </div>
        <div class="field-control">
            @switch (field().type) {
                @case ('text') {
                    @if (canEdit()) {
                        <input
                        type="text"
                        [value]="tempValue()"
                        (input)="onTextChange($event)" />
                    }
                    @else {
                        <span>{{ field().value || '—' }}</span>
                    }
                }
                @case ('text-area') {
                    @if (canEdit()) {
                        <textarea
                        [value]="tempValue()"
                        (input)="onTextChange($event)">
                        </textarea>
                    }
                    @else {
                        <span>{{ field().value || '—' }}</span>
                    }
                }
                @case ('num') {
                    @if(canEdit()){
                        <input
                        type="number"
                        [value]="tempValue()"
                        (input)="onNumberChange($event)" />
                    }
                    @else {
                        <span>{{ field().value || '—' }}</span>
                    }
                }
                @case ('select') {
                    @if(canEdit()){
                        @if( getOptionCount() <= 1){}
                        @else if(getOptionCount() == 2){
                            @for (option of getOptions(); track $index) {
                                <input type="radio"
                                    name="field-{{field().label}}"
                                    [value]="option"
                                    [checked]="tempValue() === option"
                                    (change)="onChangeOption($event)" />
                                <label>{{ option }}</label>
                            }
                        }
                        @else{
                            <select [value]="tempValue()" (change)="onChangeOption($event)">
                                @for (item of getOptions(); track $index) {
                                    <option [value]="item" [selected]="tempValue() === item">
                                        {{ item }}
                                    </option>
                                }
                            </select>
                        }
                    }
                    @else {
                        <span>{{ field().value || '—' }}</span>
                    }
                }
                @case ('slider') {
                    @if(canEdit()){
                        <input
                        type="range"
                        [min]="getMinMax()[0]"
                        [max]="getMinMax()[1]"
                        [value]="tempValue()"
                        (input)="onNumberChange($event)"
                        />
                    }
                    @else {
                        <span>{{ field().value || '—' }}</span>
                    }
                }
                @case ('color') {
                    @if(canEdit()){
                        <input
                        type="color"
                        [value]="tempValue()"
                        (input)="onTextChange($event)"
                        />
                    }@else {
                        <span>{{ field().value || '—' }}</span>
                    }
                }
                @case ('date') {
                    @if(canEdit()){
                        <input
                        type="date"
                        [value]="tempValue()"
                        (input)="onTextChange($event)"
                        />
                    }@else {
                        <span>{{ formatDate(field().value) }}</span>
                    }
                }
                @case ('file') {
                    @if(canEdit()){
                        <input
                        type="file"
                        [accept]="getAcceptedFile()"
                        (input)="onFileSelected($event)"
                        />
                    }@else {
                        <span>{{ field().value || '—' }}</span>
                    }
                }
                @case ('toggle') {
                    @if(canEdit()){
                        <input
                        type="checkbox"
                        [checked]="tempValue()"
                        (change)="onToggleChange($event)"
                        />
                    }
                    @else {
                        <span>{{ field().value || '—' }}</span>
                    }
                }
                @case ('icon') {
                    @if(canEdit()){
                        <app-icon
                        [settings]="asIconField().iconSettings"
                        [allowEdit]="field().allowEdit"
                        (fileSelected)="onFileObject($event)"
                        />
                    }
                    @else {
                        <app-icon [settings]="asIconField().iconSettings"
                        [allowEdit]="false" />
                    }
                }
            }
        </div>
    </div>
    `,
    styles: [`
  .field-row {
    display: flex;
    align-items: center;
    gap: ${DS.space[3]};
    padding: ${DS.space[3]};
    background: ${DS.colors.surfaceRaised};
    border: 1px solid ${DS.colors.borderSubtle};
    border-radius: ${DS.radius.md};
    transition: border-color 0.15s ease;
  }
  .field-row:has(input:focus, textarea:focus, select:focus) {
    border-color: ${DS.colors.violetBorder};
  }
  .field-meta {
    display: flex;
    align-items: center;
    gap: ${DS.space[2]};
    min-width: 120px;
  }
  mat-icon {
    font-size: 16px;
    width: 16px;
    height: 16px;
    color: ${DS.colors.fg3};
    flex-shrink: 0;
  }
  .field-label {
    font-size: 0.75rem;
    color: ${DS.colors.fg3};
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .required {
    color: ${DS.colors.red};
    margin-left: 2px;
  }
  .field-control {
    flex: 1;
  }
  span {
    font-size: 0.875rem;
    color: ${DS.colors.fg2};
  }
  input:not([type=checkbox]):not([type=radio]):not([type=range]),
  textarea,
  select {
    width: 100%;
    background: ${DS.colors.bg};
    border: 1px solid ${DS.colors.border};
    border-radius: ${DS.radius.sm};
    color: ${DS.colors.fg1};
    font-size: 0.875rem;
    padding: 6px 10px;
    outline: none;
    transition: border-color 0.15s ease;
    font-family: ${DS.fonts.body};
  }
  input:not([type=checkbox]):not([type=radio]):not([type=range]):focus,
  textarea:focus,
  select:focus {
    border-color: ${DS.colors.violet};
  }
  textarea {
    min-height: 80px;
    resize: vertical;
  }
  input[type=range] {
    width: 100%;
    accent-color: ${DS.colors.violet};
  }
  input[type=checkbox] {
    width: 18px;
    height: 18px;
    accent-color: ${DS.colors.violet};
    cursor: pointer;
  }
  input[type=color] {
    width: 48px;
    height: 32px;
    padding: 2px;
    border-radius: ${DS.radius.sm};
    border: 1px solid ${DS.colors.border};
    background: ${DS.colors.bg};
    cursor: pointer;
  }
  input[type=file] {
    color: ${DS.colors.fg2};
    font-size: 0.8rem;
  }
  select option {
    background: ${DS.colors.surface};
  }
  label {
    font-size: 0.8rem;
    color: ${DS.colors.fg2};
    margin-right: ${DS.space[2]};
  }
`]
})export class FieldComponent{
    field = input.required<FieldType>();
    isEditing = input.required<boolean>()
    @Output() valueChanged = new EventEmitter<FieldType>()
    @Output() fileChosen = new EventEmitter<{ label: string; file: File }>()
    tempValue = signal<FieldValue>(undefined)
    canEdit = computed(()=> this.field().allowEdit && this.isEditing())

    constructor() {
        effect(() => {
            if (!this.isEditing()) {
                this.tempValue.set(this.field().value)
            }
        })
    }

    applyChange() {
        this.valueChanged.emit({
            ...this.field(),
            value: this.tempValue()
        } as FieldType)
    }

    getOptionCount():number{
        if(this.field().type != 'select') return 0;
        else return (this.field() as SelectField).options.length;
    }

    getOptions():string[]{
        if(this.field().type != 'select') return[]
        else return (this.field() as SelectField).options
    }

    getMinMax():[number, number]{
        if(this.field().type != 'slider') return[0,0]
        else{
            const sliderField = (this.field() as SliderField )
            return[sliderField.min, sliderField.max]
        }
    }

    getAcceptedFile():string{
        if(this.field().type != 'file') return ""
        else{
            const fileField = (this.field() as FileField)
            const accepted =  fileField.accept;
            if(accepted){
                return accepted.join(', ')
            }
            else return ""
        }
    }

    asIconField(){
        return this.field() as IconField
    }

    formatDate(value: FieldValue): string {
        if (!value) return '—';
        const date = new Date(value as string);
        return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
    }

    onChangeOption(event:Event){
        const value = (event.target as HTMLInputElement).value;
        this.tempValue.set(value);
        this.applyChange();
    }

    onTextChange(event: Event) {
        const value = (event.target as HTMLInputElement).value
        this.tempValue.set(value)
        this.applyChange();
    }

    onNumberChange(event:Event){
        const value = Number((event.target as HTMLInputElement).value);
        this.tempValue.set(value);
        this.applyChange();
    }

    onFileObject(file: File) {
        this.fileChosen.emit({ label: this.field().label, file });
        const reader = new FileReader()
        reader.onload = (e) => {
            this.tempValue.set(e.target?.result as string)
            this.applyChange();
        }
        reader.readAsDataURL(file)
    }

    onFileSelected(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0]
        if (file) this.onFileObject(file)
    }

    onToggleChange(event: Event) {
        const checked = (event.target as HTMLInputElement).checked
        this.tempValue.set(checked)
        this.applyChange();
    }
}
