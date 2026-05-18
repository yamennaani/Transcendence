import { Component, computed, EventEmitter, input, Output } from "@angular/core";
import { NgStyle } from "@angular/common";
import { MatIcon } from "@angular/material/icon";

export interface AppIconSettings{
    name:string
    icon:string | undefined,
    size:number,
    borderRadius:number
    allowView:boolean,
    allowEdit:boolean,
}

@Component({
    selector:"app-icon",
    standalone: true,
    template:`
    <div [ngStyle]="styles()"> 
        @if (icon()) {
            <mat-icon>{{icon()}}</mat-icon>
        }
        @else {
            {{initials()}}
        }
    </div>
    `,
    imports: [NgStyle, MatIcon]
})
export class IconComponent{
    settings = input.required<AppIconSettings>();
    @Output() iconChanged = new EventEmitter<string>();
    
    icon = computed(()=>this.settings().icon);

    initials = computed(()=>
        this.settings().name.split('').map(w => w[0]).join('').slice(0,2).toUpperCase());

    private hue = computed(()=> 
        this.settings().name.split('').reduce((a, c)=> a + c.charCodeAt(0), 0) % 360);

    styles = computed(()=>{
        const h = this.hue(), s = this.settings().size, r = this.settings().borderRadius;
        return{
            width: `${s}px`, height: `${s}px`, borderRadius:`${r}%`,
            background: `oklch(30% 0.12 ${h})`,
            border: `1px solid oklch(45% 0.12 ${h})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: '600',
            fontSize: `${s * 0.35}px`, color: `oklch(80% 0.12 ${h})`,
            flexShrink: '0',
        };
    })
}