import { Routes } from '@angular/router'
import { HomePageComponent } from './pages/home-page/home-page'

export const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'classrooms', redirectTo: '' },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile-page/profile-page').then(m => m.ProfilePageComponent)
  },
  {
    path: 'assignments',
    loadComponent: () => import('./pages/assignments/assignments-page').then(m => m.AssignmentsPageComponent)
  },
  {
    path: 'assignment/:id',
    loadComponent: () => import('./pages/assignment-details/assignment-details-page').then(m => m.AssignmentDetailsPageComponent)
  },
  {
    path: 'eval-sheet',
    loadComponent: () => import('./pages/eval-sheet/eval-sheet').then(m => m.EvalSheetComponent)
  },
  { path: '**', redirectTo: '' }
]