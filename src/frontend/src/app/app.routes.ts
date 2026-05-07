import { Routes } from '@angular/router'
import { EvalSheetComponent } from './pages/eval-sheet/eval-sheet'

export const routes: Routes = [
  { path: 'eval-sheet', component: EvalSheetComponent },
  { path: '', redirectTo: 'eval-sheet', pathMatch: 'full' }
]