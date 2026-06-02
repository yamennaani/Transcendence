import { Component, inject, signal } from '@angular/core'
import { MatCardModule } from '@angular/material/card'
import { MatIconModule } from '@angular/material/icon'
import { MatButtonModule } from '@angular/material/button'
import { RouterLink } from '@angular/router'
import { UserProfileView, UserService } from '../../core/services/user.service'

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatButtonModule, RouterLink],
  template: `
    <main class="profile-page">
      @if (loading()) {
        <section class="state-card">
          <p>Loading profile…</p>
        </section>
      }

      @if (error()) {
        <section class="state-card state-error">
          <p>{{ error() }}</p>
        </section>
      }

      @if (profile()) {
        <section class="profile-shell">
          <mat-card class="profile-card">
            <mat-card-content>
              <div class="profile-header">
                <div class="avatar">
                  <mat-icon>account_circle</mat-icon>
                </div>
                <div>
                  <p class="eyebrow">Profile</p>
                  <h1>{{ profile()!.username }}</h1>
                  <p class="subtle">User ID: {{ profile()!.id }}</p>
                </div>
              </div>

              <div class="bio-block">
                <h2>Bio</h2>
                <p>{{ profile()!.bio }}</p>
              </div>

              <div class="profile-meta">
                <div>
                  <span class="meta-label">Email</span>
                  <p>{{ profile()!.email || 'Not set' }}</p>
                </div>
                <div>
                  <span class="meta-label">Last updated</span>
                  <p>{{ formatDate(profile()!.last_update) }}</p>
                </div>
              </div>

              <div class="actions">
                <a mat-stroked-button routerLink="/">Back to home</a>
                <a mat-flat-button color="primary" routerLink="/assignments">View assignments</a>
              </div>
            </mat-card-content>
          </mat-card>
        </section>
      }
    </main>
  `,
  styles: [
    `
      .profile-page { padding: 24px; max-width: 980px; margin: 0 auto; }
      .state-card { padding: 20px; border-radius: 16px; background: #fff; border: 1px solid #d8e0ea; }
      .state-error { border-color: #f3b4b4; color: #9f1239; }
      .profile-shell { display: grid; gap: 18px; }
      .profile-card { border-radius: 24px; border: 1px solid #d6deea; box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08); }
      .profile-header { display: flex; gap: 16px; align-items: center; margin-bottom: 20px; }
      .avatar { width: 72px; height: 72px; border-radius: 20px; display: grid; place-items: center; background: linear-gradient(145deg, #0f5b8d, #2b7bb4); color: #fff; }
      .avatar mat-icon { font-size: 44px; width: 44px; height: 44px; }
      .eyebrow { margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.12em; font-size: 0.75rem; color: #64748b; }
      h1 { margin: 0; font-size: 2rem; }
      .subtle, .profile-meta, .bio-block p { color: #526273; }
      .bio-block { padding: 18px; border-radius: 18px; background: #f8fafc; border: 1px solid #e5ebf2; }
      .bio-block h2 { margin: 0 0 8px; font-size: 1rem; }
      .profile-meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin-top: 16px; }
      .meta-label { display: block; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; color: #7b8794; }
      .actions { display: flex; gap: 12px; margin-top: 20px; flex-wrap: wrap; }
      @media (max-width: 640px) { .profile-meta { grid-template-columns: 1fr; } }
    `
  ]
})
export class ProfilePageComponent {
  private userService = inject(UserService)

  profile = signal<UserProfileView | null>(null)
  loading = signal(true)
  error = signal('')

  constructor() {
    this.loadProfile()
  }

  private loadProfile(): void {
    this.loading.set(true)
    this.error.set('')

    this.userService.getCurrentUserProfile().subscribe({
      next: (profile) => {
        this.profile.set(profile)
        this.loading.set(false)
      },
      error: (err) => {
        console.error('Failed to load profile:', err)
        this.error.set('Failed to load profile.')
        this.loading.set(false)
      }
    })
  }

  formatDate(value: string | Date | null | undefined): string {
    if (!value) return 'Not available'
    const date = value instanceof Date ? value : new Date(value)
    return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleString()
  }
}
