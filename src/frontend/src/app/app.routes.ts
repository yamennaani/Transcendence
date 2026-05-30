import { Routes } from '@angular/router';
import { inject, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, take, map } from 'rxjs';
import { AuthService } from './services/auth.service';

const authGuard = () => {
  const auth     = inject(AuthService);
  const router   = inject(Router);
  const injector = inject(Injector);

  // Fast path: already initialised, decide immediately
  if (auth.initialized()) {
    return auth.isLoggedIn() || router.parseUrl('/login');
  }

  // Slow path: wait for the silent token refresh to finish before deciding
  return toObservable(auth.initialized, { injector }).pipe(
    filter(v => v),
    take(1),
    map(() => auth.isLoggedIn() || router.parseUrl('/login')),
  );
};

const bocalGuard = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  const role   = auth.getRole();
  if (role === 'Bocal' || role === 'Admin') return true;
  return router.parseUrl('/dashboard');
};

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'verify-email',
    loadComponent: () => import('./verify-email/verify-email.component').then(m => m.VerifyEmailComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
  },
  {
    path: 'oauth-callback',
    loadComponent: () => import('./oauth-callback/oauth-callback.component').then(m => m.OAuthCallbackComponent),
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
  { path: '**', redirectTo: 'login' },
];