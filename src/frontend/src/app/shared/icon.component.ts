import { Component, computed, ElementRef, EventEmitter, input, Output, signal, ViewChild } from "@angular/core";
import { NgStyle } from "@angular/common";
import { DS } from '../tokens';
import { AppIconSettings, IconField } from "./field.types";

@Component({
    selector: "app-icon",
    standalone: true,
    template:`
    <div [ngStyle]="styles()" 
        (mouseenter)="hovered.set(true)" 
        (mouseleave)="hovered.set(false)"> 
        <input
         #fileInput
         type="file"
         accept="image/*"
         style="display: none;"
         (change)="onFileSelected($event)" />
        
        <!-- Show temporary preview or existing icon -->
        @if (tempPreviewUrl()) {
            <img [src]="tempPreviewUrl()" 
                 [style.width.px]="settings().size * 0.8" 
                 [style.height.px]="settings().size * 0.8" 
                 style="border-radius: inherit; object-fit: cover;" />
        } @else if (settings().icon) {
            <img [src]="settings().icon" 
                 [style.width.px]="settings().size * 0.8" 
                 [style.height.px]="settings().size * 0.8" 
                 style="border-radius: inherit; object-fit: cover;" />
        } @else {
            {{initials()}}
        }
        
        @if (allowEdit()) {
            <div class="edit-overlay" (click)="triggerUpload()">
                ✏️
            </div>
        }
    </div>
    `,styles: [`
    :host {
        position: relative;
        display: inline-block;
    }
    .edit-overlay {
        position: absolute;
        bottom: 4px;
        right: 4px;
        background: ${DS.colors.violet};
        border-radius: 9999px;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 14px;
        color: white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        transition: transform 0.1s ease;
        z-index: 10;
        border: 2px solid ${DS.colors.surface};
    }
    .edit-overlay:hover {
        transform: scale(1.1);
        background: ${DS.colors.violetDim};
    }
`],
    imports: [NgStyle]
    
})
export class IconComponent {
    settings = input.required<AppIconSettings>();
    allowEdit = input.required<boolean>();

    @Output() iconChanged = new EventEmitter<string>(); // Emits final URL after save
    @Output() fileSelected = new EventEmitter<File>(); // Emits raw file for parent to handle
    @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>

    hovered = signal(false);
    tempPreviewUrl = signal<string | null>(null); // Store temporary preview URL
    private currentFile = signal<File | null>(null); // Store selected file


    initials = computed(() => {
        const name = this.settings().name;
        if (!name) return '??';
        
        return name.split(' ')
            .map(w => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();
    });

    private hue = computed(() => {
        const name = this.settings().name;
        if (!name) return 0;
        
        return name.split('')
            .reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
    });
    styles = computed(() => {
        const h = this.hue(), s = this.settings().size, r = this.settings().borderRadius;
        return {
            width: `${s}px`, height: `${s}px`, borderRadius: `${r}%`,
            background: `oklch(30% 0.12 ${h})`,
            border: `1px solid oklch(45% 0.12 ${h})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: '600',
            fontSize: `${s * 0.35}px`, color: `oklch(80% 0.12 ${h})`,
            flexShrink: '0', position: 'relative', cursor: 'pointer',
            overflow: 'hidden',
        };
    })

    triggerUpload() {
        this.fileInput.nativeElement.click();
    }

    onFileSelected(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;
        
        // Validate file type and size
        if (!file.type.startsWith('image/')) {
            console.error('Please select an image file');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            console.error('File too large (max 5MB)');
            return;
        }
        
        // Store the file
        this.currentFile.set(file);
        
        // Create temporary preview URL
        const previewUrl = URL.createObjectURL(file);
        
        // Clean up old preview URL if exists
        const oldUrl = this.tempPreviewUrl();
        if (oldUrl) {
            URL.revokeObjectURL(oldUrl);
        }
        
        // Set new preview URL
        this.tempPreviewUrl.set(previewUrl);
        
        // Emit the file for parent to handle upload
        this.fileSelected.emit(file);
        
        console.log('Temporary preview created for:', file.name, previewUrl);
    }
    
    // Method to confirm upload (called by parent after successful save)
    confirmUpload(savedUrl: string) {
        // Clean up temporary preview
        const previewUrl = this.tempPreviewUrl();
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        
        // Clear temporary data
        this.tempPreviewUrl.set(null);
        this.currentFile.set(null);
        
        // Emit the final URL
        this.iconChanged.emit(savedUrl);
    }
    
    // Method to cancel upload (if user cancels or upload fails)
    cancelUpload() {
        const previewUrl = this.tempPreviewUrl();
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        this.tempPreviewUrl.set(null);
        this.currentFile.set(null);
        this.fileInput.nativeElement.value = ''; // Reset file input
    }
    
    // Clean up on component destroy
    ngOnDestroy() {
        const previewUrl = this.tempPreviewUrl();
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
    }
}