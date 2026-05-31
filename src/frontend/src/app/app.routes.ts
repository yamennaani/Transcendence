import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

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
  if (role === 'Bocal' || role === 'Admin') return true;
  return router.parseUrl('/dashboard');
};

// Redirect logged-in users away from public pages
const guestGuard = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) return true;
  const role = auth.role();
  return router.parseUrl(role === 'Admin' || role === 'Bocal' ? '/bocal' : '/dashboard');
};

export const routes: Routes = [
  {
    path: '',
    canActivate: [guestGuard],
    loadComponent: () => import('./landing/landing.component').then(m => m.LandingComponent),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent),
  },
  {
    path:'user-profile',
    canActivate: [authGuard],
    loadComponent:()=> import('./userProfile/user-profile').then(m=>m.UserProfileComponent)
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
    path:'assignment',
    canActivate:[authGuard],
    loadComponent:()=>import('./assignment-list/assignment-list.component').then(m=>m.AssignmentListComponent)
  },
  {
    path: 'assignment-detail',
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
  { path: '**', redirectTo: '' },
];
