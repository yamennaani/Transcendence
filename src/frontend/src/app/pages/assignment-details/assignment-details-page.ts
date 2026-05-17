import { Component, inject, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ActivatedRoute } from '@angular/router'
import { AssignmentService } from '../../core/services/assignment.service'

@Component({
  selector: 'app-assignment-details-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="assignment-details">
      @if (loading()) {
        <div class="loading">Loading assignment…</div>
      }

      @if (!loading() && !assignment()) {
        <div class="loading">Assignment not found.</div>
      }

      @if (assignment()) {
        <section class="details-shell">
          <header class="details-header">
            <div>
              <h2>{{ assignment()!.name || assignment()!.title }}</h2>
              <p class="meta">Assignment ID: {{ assignment()!.id }} • Class ID: {{ assignment()!.classid }}</p>
            </div>
          </header>

          <p class="description">{{ assignment()!.description }}</p>

          <section class="closed-panel">
            <p>Submission UI is disabled, it needs to be implemented</p>
          </section>
        </section>
      }
    </main>
  `,
  styles: [
    `
      .assignment-details { padding: 18px; max-width: 960px; margin: 0 auto; }
      .details-shell { display: grid; gap: 16px; }
      .details-header { display:flex; justify-content:space-between; gap: 16px; align-items:flex-start; }
      .meta, .panel-help, .description, .group-info, .feedback { color:#5b6b7a; }
      .badge { border-radius:999px; padding: 6px 10px; font-size: 0.85rem; font-weight: 600; }
      .badge-open { background:#dff4e3; color:#166534; }
      .badge-closed { background:#f2f4f7; color:#475467; }
      .submit-panel, .closed-panel { border:1px solid #d5dde6; border-radius:16px; padding:16px; background:#fff; box-shadow:0 8px 24px rgba(16,24,40,.06); }
      .file-picker { display:flex; align-items:center; gap: 12px; border:1px dashed #98a2b3; padding: 14px 16px; border-radius: 12px; cursor:pointer; margin: 12px 0; }
      .file-picker input { display:none; }
      .submit-button { border:none; border-radius: 999px; padding: 10px 18px; background:#0f5b8d; color:#fff; font-weight:600; cursor:pointer; }
      .submit-button:disabled { opacity:.6; cursor:not-allowed; }
      .group-info { display:flex; gap: 16px; margin-top: 8px; font-size: 0.9rem; }
    `
  ]
})
export class AssignmentDetailsPageComponent {
  private route = inject(ActivatedRoute)
  private service = inject(AssignmentService)
  assignment = signal<any | null>(null)
  loading = signal(true)

  constructor() {
    const id = this.route.snapshot.paramMap.get('id') || ''
    if (id) this.load(id)
  }

  private load(id: string) {
    this.loading.set(true)
    this.service.getAssignmentById(id).subscribe({
      next: (a) => {
          this.assignment.set(a)
        this.loading.set(false)
      },
      error: (err) => { console.error('assignment load failed', err); this.loading.set(false) }
    })
  }
}
