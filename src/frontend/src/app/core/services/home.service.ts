import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { catchError, delay, map, switchMap } from 'rxjs/operators'
import { forkJoin, of } from 'rxjs'

export interface QuickAction {
  id: string
  title: string
  description: string
  route: string
  icon: string
}

export interface HomeStats {
  activeClasses: number
  totalAssignments: number
  activeUsers: number
  averageRequiredEvaluators: number
  momentum: 'Rising' | 'Steady' | 'Needs attention'
}

type ClassSummary = {
  id: number
}

type AssignmentSummary = {
  req_eval: number
}

type UserSummary = {
  id: number
}

/**
 * HomeDataService provides data for the home page.
 * 
 * Key Angular concepts:
 * 1. @Injectable({ providedIn: 'root' }) - service is singleton, provided globally
 * 2. inject(HttpClient) - dependency injection pattern
 * 3. Observable-based API - returns observables that components subscribe to
 * 4. Follows the pattern from EvalService in this codebase
 */
@Injectable({ providedIn: 'root' })
export class HomeDataService {
  private http = inject(HttpClient)

  private fallbackStats: HomeStats = {
    activeClasses: 0,
    totalAssignments: 0,
    activeUsers: 0,
    averageRequiredEvaluators: 0,
    momentum: 'Needs attention'
  }

  /**
   * Mock data for quick actions.
   * In production, this would come from the backend via HTTP.
   */
  private mockQuickActions: QuickAction[] = [
    {
      id: 'eval-sheet',
      title: 'Evaluation Sheet',
      description: 'Create and manage rubric sections for an assignment.',
      route: '/eval-sheet',
      icon: 'fact_check'
    },
    {
      id: 'class-workflows',
      title: 'Class Workflows',
      description: 'Planned space for class management screens.',
      route: '/',
      icon: 'groups'
    },
    {
      id: 'submissions',
      title: 'Submissions',
      description: 'Planned space for viewing and reviewing submissions.',
      route: '/',
      icon: 'upload_file'
    }
  ]

  /**
   * Get quick actions.
   * Currently returns mock data with a simulated delay (500ms).
   * 
   * Usage in component:
   * this.homeService.getQuickActions().subscribe(actions => {
   *   this.actions.set(actions)
   * })
   */
  getQuickActions() {
    // Simulating async operation: return mock data after 500ms delay
    return of(this.mockQuickActions).pipe(
      delay(500),
      map(actions => {
        console.log('Loaded quick actions from HomeDataService')
        return actions
      })
    )
  }

  getHomeStats() {
    return this.http.get<ClassSummary[]>('/api/class/').pipe(
      switchMap((classes) => {
        const assignmentRequests = classes.map((course) =>
          this.http
            .get<AssignmentSummary[]>(`/api/class/${course.id}/assignments`)
            .pipe(catchError(() => of([])))
        )

        const assignmentsByClass$ = assignmentRequests.length > 0
          ? forkJoin(assignmentRequests)
          : of<AssignmentSummary[][]>([])

        return forkJoin({
          classes: of(classes),
          users: this.http.get<UserSummary[]>('/api/user/').pipe(catchError(() => of([]))),
          assignmentsByClass: assignmentsByClass$
        })
      }),
      map(({ classes, users, assignmentsByClass }) => {
        const assignments = assignmentsByClass.flat()
        const totalAssignments = assignments.length

        const averageRequiredEvaluators = totalAssignments > 0
          ? Math.round(assignments.reduce((sum, assignment) => sum + (assignment.req_eval ?? 0), 0) / totalAssignments)
          : 0

        const momentum: HomeStats['momentum'] = totalAssignments > 8
          ? 'Rising'
          : totalAssignments > 3
            ? 'Steady'
            : 'Needs attention'

        return {
          activeClasses: classes.length,
          totalAssignments,
          activeUsers: users.length,
          averageRequiredEvaluators,
          momentum
        }
      }),
      catchError((error) => {
        console.warn('Home stats API unavailable, using fallback stats.', error)
        return of(this.fallbackStats)
      })
    )
  }

  /**
   * Optional: placeholder for future backend integration.
   * When backend is ready, uncomment this and update getQuickActions() to use it.
   */
  // getQuickActionsFromBackend() {
  //   return this.http.get<QuickAction[]>(`${this.baseUrl}/actions`)
  // }
}
