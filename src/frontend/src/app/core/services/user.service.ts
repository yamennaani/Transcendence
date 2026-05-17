import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { catchError, forkJoin, map, of } from 'rxjs'

export type UserProfileView = {
  id: number
  username: string
  email: string
  bio: string
  last_update?: string | Date
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient)

  readonly DEMO_USER_ID = '1'

  getCurrentUserProfile(userId: string | number = this.DEMO_USER_ID) {
    return forkJoin({
      user: this.http.get<any>(`/api/user/${userId}`).pipe(catchError(() => of(null))),
      profile: this.http.get<any>(`/api/user/${userId}/profile`).pipe(catchError(() => of(null)))
    }).pipe(
      map(({ user, profile }) => ({
        id: Number(user?.id ?? userId),
        username: user?.username ?? 'Unknown user',
        email: user?.email ?? '',
        bio: profile?.bio ?? 'No bio available yet.',
        last_update: profile?.last_update ?? null
      }))
    )
  }
}
