import { Component, signal, computed, inject } from '@angular/core'
import { EvalService } from '../../core/services/eval.service'
import { FormsModule } from '@angular/forms'
import { CommonModule } from '@angular/common'

// Material
import { MatCardModule } from '@angular/material/card'
import { MatButtonModule } from '@angular/material/button'
import { MatInputModule } from '@angular/material/input'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatRadioModule } from '@angular/material/radio'
import { MatChipsModule } from '@angular/material/chips'
import { MatDividerModule } from '@angular/material/divider'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatIconModule } from '@angular/material/icon'

@Component({
  selector: 'app-eval-sheet',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatRadioModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  templateUrl: './eval-sheet.html',
  styleUrl: './eval-sheet.css'
})
export class EvalSheetComponent {
  private evalService = inject(EvalService)

  // ── State (signals) ──────────────────────────────
  assIdInput = signal('')           // what the user types in the input
  assignment = signal<any>(null)    // loaded assignment
  sheet = signal<any>(null)         // loaded eval sheet (or null)
  loading = signal(false)
  error = signal('')

  // section form state
  sectionName = signal('')
  sectionDesc = signal('')
  sectionMarks = signal(0)
  sectionType = signal<'Toggle' | 'Slider'>('Toggle')

  // ── Computed ─────────────────────────────────────
  hasSheet = computed(() => this.sheet() !== null)
  sections = computed(() => this.sheet()?.sections ?? [])
  totalMarks = computed(() =>
    this.sections().reduce((sum: number, s: any) => sum + s.marks, 0)
  )

  // ── Actions ──────────────────────────────────────
  loadAssignment() {
    const id = parseInt(this.assIdInput())
    if (!id) return

    this.loading.set(true)
    this.error.set('')
    this.assignment.set(null)
    this.sheet.set(null)

    this.evalService.getAssignment(id).subscribe({
      next: (ass) => {
        this.assignment.set(ass)
        // now check if it already has a sheet
        this.evalService.getSheetByAssignment(id).subscribe({
          next: (sheet) => {
            this.sheet.set(sheet)
            this.loading.set(false)
          },
          error: (err) => {
            // 404 means no sheet yet — that's fine, not a real error
            if (err.status === 404) this.loading.set(false)
            else this.error.set('Failed to load sheet')
            this.loading.set(false)
          }
        })
      },
      error: () => {
        this.error.set('Assignment not found')
        this.loading.set(false)
      }
    })
  }

  createSheet() {
    const id = parseInt(this.assIdInput())
    this.loading.set(true)
    this.evalService.createSheet(id).subscribe({
      next: (sheet) => {
        this.sheet.set({ ...sheet, sections: [] })
        this.loading.set(false)
      },
      error: () => {
        this.error.set('Failed to create sheet')
        this.loading.set(false)
      }
    })
  }

  addSection() {
    const sheetId = this.sheet()?.id
    if (!sheetId) return

    const data = {
      name: this.sectionName(),
      description: this.sectionDesc(),
      marks: this.sectionMarks(),
      sectionType: this.sectionType()
    }

    this.loading.set(true)
    this.evalService.createSection(sheetId, data).subscribe({
      next: (section) => {
        // update the sheet signal with the new section added
        this.sheet.update(s => ({
          ...s,
          sections: [...s.sections, section]
        }))
        // reset the form
        this.sectionName.set('')
        this.sectionDesc.set('')
        this.sectionMarks.set(0)
        this.sectionType.set('Toggle')
        this.loading.set(false)
      },
      error: () => {
        this.error.set('Failed to add section')
        this.loading.set(false)
      }
    })
  }
}