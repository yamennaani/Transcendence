import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatIconModule } from '@angular/material/icon'
import { MatButtonModule } from '@angular/material/button'

@Component({
  selector: 'app-header-nav',
  standalone: true,
  imports: [RouterLink, MatToolbarModule, MatIconModule, MatButtonModule],
  template: `
    <mat-toolbar class="topbar" color="primary">
      <div class="nav-left">
        <a class="brand" routerLink="/">Transcendence</a>
      </div>
      <div class="nav-center">
        <a mat-button routerLink="/" class="nav-item">
          <mat-icon>home</mat-icon>
          <span>Home</span>
        </a>
        <a mat-button routerLink="/classrooms" class="nav-item">
          <mat-icon>class</mat-icon>
          <span>Classrooms</span>
        </a>
        <a mat-button routerLink="/assignments" class="nav-item">
          <mat-icon>assignment</mat-icon>
          <span>Assignments</span>
        </a>
      </div>
      <div class="nav-right">
        <a mat-icon-button routerLink="/profile" aria-label="Open profile page">
          <mat-icon>account_circle</mat-icon>
        </a>
      </div>
    </mat-toolbar>
  `,
  styles: [
    `
      .topbar { display:flex; justify-content:space-between; align-items:center; padding:0 12px; }
      .nav-left .brand { font-weight:700; color: #fff; text-decoration:none; }
      .nav-center { display:flex; gap:6px; align-items:center; }
      .nav-item { display:flex; flex-direction:column; align-items:center; color: #fff; font-size: 12px; }
      .nav-item mat-icon { font-size:20px; }
      .nav-right { display:flex; align-items:center; }
    `
  ]
})
export class HeaderNavComponent {}
