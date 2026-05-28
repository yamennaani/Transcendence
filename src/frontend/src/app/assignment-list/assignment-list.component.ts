import { Component, inject, signal, effect, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AssignmentService, AssignmentResponse } from '../core/services/course-service/Assignment.service';
import { ListComponent, ListColumn } from '../shared/list.component';

@Component({
  selector: 'app-assignment-list',
  standalone: true,
  imports: [ListComponent],
  template: `
    <div class="page">
      <app-list
        [items]="assignments()"
        [trackBy]="trackFn"
        [columns]="columns()"
        title="Assignments"
        overline="Class Assignments"
        emptyMessage="No assignments for this class"
        [pageSize]="8"
        (rowClick)="navigate($event)">
      </app-list>
    </div>
  `,
  styles: [`
    .page { flex: 1; overflow-y: auto; padding: 32px; }
  `],
})
export class AssignmentListComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private assignmentService = inject(AssignmentService);

  assignments = this.assignmentService.Assignments;
  private classId = signal<number | null>(null);

  constructor() {
    effect(() => {
      const id = this.classId();
      if (id) this.assignmentService.getAssignments(id).subscribe();
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['classId']) this.classId.set(parseInt(params['classId'], 10));
    });
  }

  columns = computed<ListColumn<AssignmentResponse>[]>(() => [
    { label: 'Assignment Name',       render: a => a.name },
    { label: 'Max Score',             render: a => `${a.max_score} points` },
    { label: 'Required Evaluations',  render: a => `${a.req_eval} evals` },
  ]);

  readonly trackFn = (a: AssignmentResponse) => a.id;

  navigate(assignment: AssignmentResponse): void {
    this.router.navigate(['/assignment-detail'], { queryParams: { assId: assignment.id } });
  }
}
