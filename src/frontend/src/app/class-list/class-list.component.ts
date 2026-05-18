import { Component, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Course, DS } from '../tokens';
import { CourseService } from '../core/services/course-service/course-service';
import {
  GenericListComponent,
  GenericListConfig,
  ListColumnConfig,
  ProgressData,
} from '../shared/list.component';
import {
  hasPassedCourse,
  getProgressLabel,
  getAssignmentCount,
} from '../utilities/course-utilities';
import { AssignmentService } from '../core/services/course-service/Assignment.service';

@Component({
  selector: 'app-class-list',
  standalone: true,
  imports: [GenericListComponent],
  template: `
    <app-generic-list
      [config]="classListConfig()"
      [items]="userCourses() ?? []"
      [progressDataFn]="getProgressData"
      (itemClicked)="onClassClicked($event)" />
  `,
})
export class ClassListComponent {
  private router = inject(Router);
  private courseService = inject(CourseService);
  private assignmentService = inject(AssignmentService)

  // ⭐ This is a Signal - we dereference it in the template with userCourses()
  userCourses = this.courseService.UserCourses;

  /**
   * Configure columns for the class list
   */
  classColumns = computed<ListColumnConfig<Course>[]>(() => [
    {
      key: 'name',
      label: 'Class Name',
      render: (course) => course.name,
    },
    {
      key: 'org_id',
      label: 'Organization',
      render: () => 'My Static Org',
    },
    {
      key: 'assignments',
      label: 'Assignments',
      render: (course) => `${getAssignmentCount(course)} assignments`,
    },
    {
      key: 'pass_threshold',
      label: 'Threshold',
      render: (course) => `${course.pass_threshold}% threshold`,
    },
  ]);

  /**
   * Main list configuration
   */
  classListConfig = computed<GenericListConfig<Course>>(() => ({
    title: 'My classes',
    subtitle: 'Enrolled',
    columns: this.classColumns(),
    trackBy: (course) => course.id,
    emptyMessage: 'No courses enrolled yet',
    badge: {
      show: (course) => hasPassedCourse(course),
      variant: 'validated',
      label: 'PASSED',
    },
    rowConfig: {
      defaultBg: DS.colors.surface,
      hoverBg: DS.colors.surfaceRaised,
      borderColor: (course) =>
        hasPassedCourse(course) ? DS.colors.greenBorder : DS.colors.border,
    },
    onRowClick: (course) => this.navigateToClass(course.id),
  }));

  /**
   * Provide progress data for the progress bar
   * ⭐ THIS IS KEY: Return a function that takes an item and returns ProgressData | null
   */
  getProgressData = (course: Course): ProgressData | null => {
    const total = getAssignmentCount(course);
    if (total === 0) return null;

    return {
      value: course.done,
      max: total,
      label: getProgressLabel(course),
    };
  };

  /**
   * Handle class click
   */
  onClassClicked(course: Course): void {
    this.navigateToClass(course.id);
  }

  /**
   * Navigate to assignments for selected class
   */
  private navigateToClass(courseId: number): void {
    this.router.navigate(['/assignment'], { queryParams: { classId: courseId } });
  }
}