import { Component, inject, signal, effect, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DS } from '../tokens';
import { AssignmentService, AssignmentResponse } from '../core/services/course-service/Assignment.service';
import {
  GenericListComponent,
  GenericListConfig,
  ListColumnConfig,
} from '../shared/list.component';
import { computed } from '@angular/core';

@Component({
  selector: 'app-assignment-list',
  standalone: true,
  imports: [GenericListComponent],
  template: `
    <app-generic-list
      [config]="assignmentListConfig()"
      [items]="assignments()"
      (itemClicked)="onAssignmentClicked($event)" />
  `,
})
export class AssignmentListComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private assignmentService = inject(AssignmentService);

  assignments = this.assignmentService.Assignments;
  private classId = signal<number | null>(null);

  constructor() {
    // Auto-load when classId changes
    effect(() => {
      const id = this.classId();
      if (id) {
        this.assignmentService.getAssignments(id).subscribe();
      }
    });
  }

  ngOnInit(): void {
    // Get classId from route query params
    this.route.queryParams.subscribe((params) => {
      console.log(params)
      if (params['classId']) {
        this.classId.set(parseInt(params['classId'], 10));
      }
    });
  }

  assignmentColumns = computed<ListColumnConfig<AssignmentResponse>[]>(() => [
    {
      key: 'name',
      label: 'Assignment Name',
      render: (a) => a.name,
    },
    {
      key: 'max_score',
      label: 'Max Score',
      render: (a) => `${a.max_score} points`,
    },
    {
      key: 'req_eval',
      label: 'Required Evaluations',
      render: (a) => `${a.req_eval} evals`,
    },
  ]);

  assignmentListConfig = computed<GenericListConfig<AssignmentResponse>>(() => ({
    title: 'Assignments',
    subtitle: 'Class Assignments',
    columns: this.assignmentColumns(),
    trackBy: (assignment) => assignment.id,
    emptyMessage: 'No assignments for this class',
    rowConfig: {
      defaultBg: DS.colors.surface,
      hoverBg: DS.colors.surfaceRaised,
      borderColor: () => DS.colors.border,
    },
    onRowClick: (assignment) => this.router.navigate(['/assignment', assignment.id]),
  }));

  onAssignmentClicked(assignment: AssignmentResponse): void {
    this.router.navigate(['/assignment-detail'], { queryParams: { assId: assignment.id } });
  }
}