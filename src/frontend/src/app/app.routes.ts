import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

// Auth guard using inject()
const authGuard = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn()) return true;
  return router.parseUrl('/login');
};

const bocalGuard = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  const role   = auth.role();
  if (role === 'bocal' || role === 'admin') return true;
  return router.parseUrl('/dashboard');
};

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'classes',
    canActivate: [authGuard],
    loadComponent: () => import('./class-list/class-list.component').then(m => m.ClassListComponent),
  },
  {
    path: 'assignment',
    canActivate: [authGuard],
    loadComponent: () => import('./assignment-detail/assignment-detail.component').then(m => m.AssignmentDetailComponent),
  },
  {
    path: 'evaluation',
    canActivate: [authGuard],
    loadComponent: () => import('./evaluation-flow/evaluation-flow.component').then(m => m.EvaluationFlowComponent),
  },
  {
    path: 'progress',
    canActivate: [authGuard],
    loadComponent: () => import('./progress/progress.component').then(m => m.ProgressComponent),
  },
  {
    path: 'bocal',
    canActivate: [authGuard, bocalGuard],
    loadComponent: () => import('./bocal-panel/bocal-panel.component').then(m => m.BocalPanelComponent),
  },
  { path: '**', redirectTo: 'login' },
];
