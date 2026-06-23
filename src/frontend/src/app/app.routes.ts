import { Routes, ActivatedRouteSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';
import { AuthService } from './services/auth.service';
import { isSupportedLang } from './languages/language.service';

const waitForInit = (auth: AuthService, fn: () => boolean | ReturnType<Router['parseUrl']>) => {
  if (auth.initialized()) return fn();
  return toObservable(auth.initialized).pipe(
    filter(Boolean),
    take(1),
    map(() => fn()),
  );
};

const authGuard = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  return waitForInit(auth, () => auth.isLoggedIn() ? true : router.parseUrl('/login'));
};

const bocalGuard = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  return waitForInit(auth, () => {
    const role = auth.role();
    return (role === 'Bocal' || role === 'Admin') ? true : router.parseUrl('/dashboard');
  });
};

const adminGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const role = auth.role();
  if (role === 'Admin') return true;
  return router.parseUrl('/dashboard');
};

// Restricts /:lang to supported language codes so it doesn't swallow unknown paths
const langGuard = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  return isSupportedLang(route.paramMap.get('lang')) ? true : router.parseUrl('/');
};

// Redirect logged-in users away from public pages
const guestGuard = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  return waitForInit(auth, () => {
    if (!auth.isLoggedIn()) return true;
    const role = auth.role();
    return router.parseUrl(role === 'Admin' || role === 'Bocal' ? '/bocal' : '/dashboard');
  });
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
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () => import('./forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
  },
  {
    // Not guestGuard-ed: a reset link must work even if the browser still has
    // an active session (e.g. after the user logged back in while waiting on the email).
    path: 'reset-password',
    loadComponent: () => import('./reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
  },
  {
    path: 'verify-email',
    loadComponent: () => import('./verify-email/verify-email.component').then(m => m.VerifyEmailComponent),
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
    path: 'eval-assignments',
    canActivate: [authGuard],
    loadComponent: () => import('./eval-assignment-list/eval-assignment-list.component').then(m => m.EvalAssignmentListComponent),
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
    children: [
      { path: '', redirectTo: 'classes', pathMatch: 'full' },
      {
        path: 'classes',
        loadComponent: () => import('./bocal-panel/classes/bocal-classes.component').then(m => m.BocalClassesComponent),
      },
      {
        path: 'students',
        loadComponent: () => import('./bocal-panel/students/bocal-students.component').then(m => m.BocalStudentsComponent),
      },
      {
        path: 'analytics',
        loadComponent: () => import('./bocal-panel/analytics/bocal-analytics.component').then(m => m.BocalAnalyticsComponent),
      },
      {
        path: 'assignment-create',
        loadComponent: () => import('./bocal-panel/assignment-create/assignment-create.component').then(m => m.AssignmentCreateComponent),
      },
    ],
  },
  
  {
    path: 'admin/orgs',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./admin/orgs/orgs.component').then(m => m.AdminOrgsComponent),
  },
  {
    path: 'admin/org/:id',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./admin/org-detail/org-detail.component').then(m => m.AdminOrgDetailComponent),
  },
  {
    path: 'oauth-callback',
    loadComponent: () => import('./oauth-callback/oauth-callback.component').then(m => m.OAuthCallbackComponent),
  },
  {
    path: 'privacy-policy',
    loadComponent: () => import('./legal/privacy-policy.component').then(m => m.PrivacyPolicyComponent),
  },
  {
    path: 'terms-of-service',
    loadComponent: () => import('./legal/terms-of-service.component').then(m => m.TermsOfServiceComponent),
  },
  {
    // /en, /de, /hu, /ar — landing page pinned to a specific language.
    // Placed after every static path above so those always win the match first.
    path: ':lang',
    canActivate: [guestGuard, langGuard],
    loadComponent: () => import('./landing/landing.component').then(m => m.LandingComponent),
  },
  { path: '**', redirectTo: '' },
];
