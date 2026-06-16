import { Component, inject, signal, computed } from '@angular/core'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { HomeDataService, HomeStats } from '../../core/services/home.service'
import { AssignmentCardComponent } from '../../components/assignment-card/assignment-card'
import { AssignmentService } from '../../core/services/assignment.service'

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [AssignmentCardComponent, TranslateModule],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css'
})
export class HomePageComponent {
  private homeService       = inject(HomeDataService)
  private assignmentService = inject(AssignmentService)
  private translate         = inject(TranslateService)

  // ── State (signals) ──────────────────────────────
  stats              = signal<HomeStats | null>(null)
  statsLoading       = signal(true)
  assignmentsLoading = signal(true)
  assignments        = signal<any[]>([])
  error              = signal('')

  isLoading = computed(() => this.statsLoading() || this.assignmentsLoading())

  totalWorkItems = computed(() => {
    const s = this.stats()
    if (!s) return 0
    return s.activeClasses + s.totalAssignments
  })

  // ── Translated computed strings ───────────────────
  // These are methods rather than computed() signals because translate.instant()
  // needs to be called at render time to pick up the active language — the same
  // pattern used in bocal-panel and dashboard components.
  get dashboardTone(): string {
    const s = this.stats()
    if (!s) return this.translate.instant('home_tone_loading')
    if (s.momentum === 'Rising')  return this.translate.instant('home_tone_rising')
    if (s.momentum === 'Steady')  return this.translate.instant('home_tone_steady')
    return this.translate.instant('home_tone_needs_attention')
  }

  get errorMessage(): string {
    return this.error()
      ? this.translate.instant('home_error_stats')
      : ''
  }

  constructor() {
    this.loadStats()
    this.loadAssignments()
  }

  private loadAssignments(): void {
    this.assignmentsLoading.set(true)
    this.assignmentService.getAssignmentsForUser(this.assignmentService.DEMO_USER_ID).subscribe({
      next: (list) => {
        this.assignments.set(list)
        this.assignmentsLoading.set(false)
      },
      error: (err) => {
        console.error('Failed to load assignments:', err)
        this.assignmentsLoading.set(false)
      }
    })
  }

  private loadStats(): void {
    this.statsLoading.set(true)
    this.homeService.getHomeStats().subscribe({
      next: (loadedStats) => {
        this.stats.set(loadedStats)
        this.statsLoading.set(false)
      },
      error: (err) => {
        console.error('Failed to load home stats:', err)
        this.error.set('error')
        this.statsLoading.set(false)
      }
    })
  }
}