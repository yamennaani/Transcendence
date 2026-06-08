import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EvalAssignment, EvalService} from '../core/services/eval-service/eval-service';
import { ListComponent, ListColumn } from '../shared/list.component';
import { BtnComponent } from '../shared/btn.component';
import { LoadingService } from '../core/services/loading-service/loading.service';

@Component({
  selector: 'app-eval-assignment-list',
  standalone: true,
  imports: [ListComponent, BtnComponent],
  template: `
    <div class="page">
      <div class="header-row">
        <div>
          <div class="overline">Peer evaluation</div>
          <h1>Evaluation pairings</h1>

          @if (assignmentId()) {
            <p class="subline">Assignment ID: {{ assignmentId() }}</p>
          } @else {
            <p class="subline">No assignment selected.</p>
          }
        </div>

        <div class="actions">
          <app-btn
            variant="secondary"
            (clicked)="goBackToAssignment()">
            Back to assignment
          </app-btn>

          <app-btn
            variant="primary"
            [disabled]="!assignmentId() || loading()"
            (clicked)="generateSimplePairings()">
            Generate simple pairings
          </app-btn>
        </div>
      </div>

      @if (error()) {
        <div class="error-banner">
          {{ error() }}
        </div>
      }

      @if (loading()) {
        <div class="loading">
          Loading evaluation pairings…
        </div>
      }

      <app-list
        [items]="evalAssignments()"
        [trackBy]="trackFn"
        [columns]="columns()"
        title="EvalAssignments"
        overline="Generated pairings"
        emptyMessage="No evaluation pairings found for this assignment."
        [pageSize]="10">
      </app-list>
    </div>
  `,
  styles: [`
    .page { flex: 1; overflow-y: auto; padding: 32px; display: flex; flex-direction: column; gap: 20px; }

    .header-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; flex-wrap: wrap; }

    h1 { margin: 0; font-size: 1.75rem; }

    .overline { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.75; margin-bottom: 6px; }

    .subline { margin: 6px 0 0; opacity: 0.75; font-size: 0.9rem; }

    .actions { display: flex; gap: 10px; flex-wrap: wrap; }

    .error-banner { border: 1px solid #f0aaaa; background: #fff0f0; color: #9f1d1d;
      border-radius: 8px; padding: 10px 14px; font-size: 0.875rem; }

    .loading { font-size: 0.875rem; opacity: 0.75; }
  `],
})
export class EvalAssignmentListComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private evalService = inject(EvalService);
  private loadingService = inject(LoadingService);

  assignmentId = signal<number | null>(null);
  evalAssignments = signal<EvalAssignment[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  readonly trackFn = (ea: EvalAssignment) => ea.id;

  columns = computed<ListColumn<EvalAssignment>[]>(() => [
    { label: 'ID', render: ea => `${ea.id}` },
    { label: 'Round', render: ea => `${ea.round}` },
    { label: 'Evaluator User', render: ea => `${ea.evaluatorUserId}` },
    { label: 'Evaluator Group', render: ea => `${ea.evaluatorGroupId ?? '—'}` },
    { label: 'Evaluee Group', render: ea => `${ea.evalueeGroupId}` },
    { label: 'Status', render: ea => ea.status },
  ]);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const raw = params['assignmentId'] ?? params['assId'];

      if (!raw) {
        this.error.set('Missing assignmentId in the URL.');
        return;
      }

      const id = parseInt(raw, 10);

      if (Number.isNaN(id)) {
        this.error.set('Invalid assignmentId in the URL.');
        return;
      }

      this.assignmentId.set(id);
      this.loadEvalAssignments(id);
    });
  }

  private loadEvalAssignments(assignmentId: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.evalService.getEvalAssignments(assignmentId).subscribe({
      next: rows => {
        this.evalAssignments.set(rows);
        this.loading.set(false);
      },
      error: err => {
        this.error.set(
          err?.error?.message ?? 'Failed to load evaluation pairings.'
        );
        this.loading.set(false);
      },
    });
  }

  generateSimplePairings(): void {
    const id = this.assignmentId();

    if (!id) {
      this.error.set('Cannot generate pairings without an assignment id.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.loadingService.show();

    this.evalService.generateSimplePairings(id).subscribe({
      next: rows => {
        this.evalAssignments.set(rows);
        this.loading.set(false);
        this.loadingService.hide();
      },
      error: err => {
        this.error.set(
          err?.error?.message ?? 'Failed to generate simple pairings.'
        );
        this.loading.set(false);
        this.loadingService.hide();
      },
    });
  }

  goBackToAssignment(): void {
    const id = this.assignmentId();

    if (!id) {
      this.router.navigate(['/assignment']);
      return;
    }

    this.router.navigate(['/assignment-detail'], {
      queryParams: { assId: id },
    });
  }
}