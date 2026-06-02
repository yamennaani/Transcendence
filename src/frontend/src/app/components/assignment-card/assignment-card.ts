import { Component, Input } from '@angular/core'
import { RouterLink } from '@angular/router'
import { MatCardModule } from '@angular/material/card'
import { MatIconModule } from '@angular/material/icon'
import { MatButtonModule } from '@angular/material/button'

@Component({
  selector: 'app-assignment-card',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <mat-card class="assignment-card">
      <mat-card-content>
        <div class="row">
          <div class="title">
            <h3>{{ title }}</h3>
            <p class="meta">Due: {{ dueDate || '—' }} • {{ status || 'Open' }}</p>
          </div>
          <div class="actions">
            <a mat-button color="primary" [routerLink]="['/assignment', id]">Open</a>
          </div>
        </div>
        <p class="description">{{ description }}</p>
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      .assignment-card { margin-bottom: 12px; border-radius: 12px; }
      .row { display:flex; justify-content:space-between; align-items:center; }
      .title h3 { margin:0; font-size:1rem; }
      .meta { margin: 4px 0 0; color: #5b6b7a; font-size: 0.85rem; }
      .description { margin-top: 8px; color: #394a5a; }
    `
  ]
})
export class AssignmentCardComponent {
  @Input() id: string | number = ''
  @Input() title: string = ''
  @Input() dueDate?: string
  @Input() status?: string
  @Input() description?: string
}
