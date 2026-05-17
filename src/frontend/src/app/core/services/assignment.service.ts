import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { catchError, map, switchMap } from 'rxjs/operators'
import { forkJoin, of } from 'rxjs'

/** Minimal assignment service that aggregates assignments from classes.
 * For demo mode we expose `DEMO_USER_ID` which the UI uses.
 */
@Injectable({ providedIn: 'root' })
export class AssignmentService {
  private http = inject(HttpClient)

  // Demo user id used while auth is not integrated
  readonly DEMO_USER_ID = '1'

  getAssignmentsForUser(userId: string) {
    // Fetch classes, then fetch assignments per class and flatten
    return this.http.get<any[]>('/api/class/').pipe(
      switchMap((classes) => {
        const reqs = classes.map((c: any) =>
          this.http.get<any[]>(`/api/class/${c.id}/assignments`).pipe(catchError(() => of([])))
        )
        const all$ = reqs.length > 0 ? forkJoin(reqs) : of<any[][]>([])
        return all$
      }),
      map((assignmentsByClass) => assignmentsByClass.flat()),
      map((assignments) => {
        // Try to filter by common fields (assignees, userId); otherwise return all
        const filtered = assignments.filter((a: any) => {
          if (!a) return false
          if (a.assignees && Array.isArray(a.assignees)) return a.assignees.includes(userId)
          if (a.assignedTo) return a.assignedTo === userId
          if (a.userId) return a.userId === userId
          return false
        })
        return filtered.length > 0 ? filtered : assignments
      }),
      catchError((err) => {
        console.warn('AssignmentService: API unavailable, returning empty list', err)
        return of([])
      })
    )
  }

  getAssignmentById(id: string | number) {
    return this.http.get<any>(`/api/class/assignment/${id}`).pipe(
      catchError(() => this.http.get<any>(`/api/assignment/${id}`).pipe(catchError(() => of(null))))
    )
  }
}
