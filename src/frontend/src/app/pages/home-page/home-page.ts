import { Component, inject, signal, computed } from '@angular/core'
import { HomeDataService, HomeStats } from '../../core/services/home.service'
import { AssignmentCardComponent } from '../../components/assignment-card/assignment-card'
import { AssignmentService } from '../../core/services/assignment.service'

/**
 * HomePageComponent displays the user's assignments and key stats.
 * 
 * Key Angular concepts demonstrated:
 * 1. Service injection: loading data from HomeDataService and AssignmentService
 * 2. Signal-based state: tracks loading states for assignments and stats
 * 3. Computed signals: derive dashboard metrics from loaded data
 * 4. Data flow: assignments flow down to child AssignmentCard components
 * 5. Loading/error states: proper UI feedback during data fetching
 */
@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [AssignmentCardComponent],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css'
})
export class HomePageComponent {
  private homeService = inject(HomeDataService)
  private assignmentService = inject(AssignmentService)

  // ── State (signals) ──────────────────────────────
  /** Stats loaded from service */
  stats = signal<HomeStats | null>(null)

  /** Per-request loading states */
  statsLoading = signal(true)
  assignmentsLoading = signal(true)

  /** Assignments for current user (demo) */
  assignments = signal<any[]>([])

  /** Combined loading state using computed signal */
  isLoading = computed(() => this.statsLoading() || this.assignmentsLoading())

  /** Error state */
  error = signal('')

  /** Derived metrics from stats signal */
  totalWorkItems = computed(() => {
    const loadedStats = this.stats()
    if (!loadedStats) return 0
    return loadedStats.activeClasses + loadedStats.totalAssignments
  })

  dashboardTone = computed(() => {
    const loadedStats = this.stats()
    if (!loadedStats) return 'Loading your dashboard pulse...'

    if (loadedStats.momentum === 'Rising') {
      return 'Great momentum this week. Keep the review cadence going.'
    }

    if (loadedStats.momentum === 'Steady') {
      return 'Steady performance. A small push can raise completion speed.'
    }

    return 'A few signals need attention. Add new assignments to kickstart activity.'
  })

  constructor() {
    // Load data on component initialization
    this.loadStats()
    this.loadAssignments()
  }

  // ── Actions ──────────────────────────────────────

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
        this.error.set('Failed to load dashboard stats. Please try again.')
        this.statsLoading.set(false)
      }
    })
  }

}

