import { Component, computed, EventEmitter, input, Output } from "@angular/core";
import { AppIconSettings } from "./field.types";
import { IconComponent } from "./icon.component";

export interface HeaderConfig{
    label:string | undefined,
    icon:string | undefined,
    iconSettings: AppIconSettings,
    canEditIcon: boolean,
    canEditlabel: boolean
}

@Component({
    selector: 'app-header',
    standalone: true,
    template:`
    <div>
        <app-icon
        [settings]="iconSettings()"
        [allowEdit]="config().canEditIcon"
        (iconChanged)="iconChanged"
        (fileSelected)="fileSelected"/>
        <h2>{{config().label}}</h2>
    </div>
    `,
    styles:[``],
    imports: [IconComponent]
})export class HeaderComponent{
    config = input.required<HeaderConfig>();
    @Output() iconChanged = new EventEmitter<string>()
    @Output() fileSelected = new EventEmitter<File>();

    iconSettings = computed(()=> this.config().iconSettings);
}