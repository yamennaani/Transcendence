import { Component, inject, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { AssignmentService } from '../../core/services/assignment.service'
import { AssignmentCardComponent } from '../../components/assignment-card/assignment-card'

@Component({
  selector: 'app-assignments-page',
  standalone: true,
  imports: [CommonModule, AssignmentCardComponent],
  template: `
    <main class="assignments-page">
      <header class="section-header">
        <h2>Your Assignments</h2>
        <p>All assignments for the demo user</p>
      </header>

      <div *ngIf="loading()" class="loading">Loading assignments…</div>

      <section *ngIf="!loading() && assignments().length === 0" class="empty">
        <p>No assignments found for your account.</p>
      </section>

      <section *ngIf="assignments().length > 0" class="list">
        <app-assignment-card *ngFor="let a of assignments()" [id]="a.id" [title]="a.title" [dueDate]="a.dueDate" [status]="a.status" [description]="a.description"></app-assignment-card>
      </section>
    </main>
  `,
  styles: [
    `
      .assignments-page { padding: 20px; }
      .section-header h2 { margin:0 0 6px 0; }
      .list { margin-top: 12px; }
    `
  ]
})
export class AssignmentsPageComponent {
  private service = inject(AssignmentService)

  assignments = signal<any[]>([])
  loading = signal(true)

  constructor() {
    this.load()
  }

  private load() {
    this.loading.set(true)
    this.service.getAssignmentsForUser(this.service.DEMO_USER_ID).subscribe({
      next: (list) => {
        this.assignments.set(list)
        this.loading.set(false)
      },
      error: (err) => {
        console.error('Failed to load assignments', err)
        this.loading.set(false)
      }
    })
  }
}
