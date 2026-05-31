import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Course, DS } from '../tokens';
import { CourseService } from '../core/services/course-service/course-service';
import { EnrollService } from '../core/services/enroll-service/enroll-service';
import { AuthService } from '../auth.service';
import { LoadingService } from '../core/services/loading-service/loading.service';
import { ListComponent, ListColumn, ListBadge, ListProgressData } from '../shared/list.component';
import { SlicePipe } from '@angular/common';
import { BtnComponent } from '../shared/btn.component';
import { hasPassedCourse, getProgressLabel, getAssignmentCount } from '../utilities/course-utilities';

@Component({
  selector: 'app-class-list',
  standalone: true,
  imports: [ListComponent, BtnComponent, SlicePipe],
  template: `
    <div class="page">

      <!-- ── Enrolled classes ──────────────────────────────── -->
      <app-list
        [items]="userCourses()"
        [trackBy]="trackFn"
        [columns]="enrolledColumns()"
        title="My classes"
        overline="Enrolled"
        emptyMessage="You haven't enrolled in any class yet."
        [badge]="badge"
        [progressFn]="progressFn"
        [pageSize]="8"
        (rowClick)="navigate($event.id)">
      </app-list>

      <!-- ── Browse available classes ───────────────────────── -->
      @if (availableClasses().length > 0) {
        <app-list
          [items]="availableClasses()"
          [trackBy]="trackFn"
          title="Browse classes"
          overline="Available"
          [pageSize]="8">
          <ng-template let-course>
            <div class="avail-row">
              <div class="avail-info">
                <span class="avail-name">{{ course.name }}</span>
                <span class="avail-meta">
                  {{ course.assignments?.length ?? 0 }} assignments
                  · {{ course.pass_threshold }}% threshold
                  @if (course.description) { · {{ course.description | slice:0:60 }}{{ course.description.length > 60 ? '…' : '' }} }
                </span>
              </div>
              <app-btn variant="secondary" size="sm" (clicked)="enroll(course)">Enroll →</app-btn>
            </div>
          </ng-template>
        </app-list>
      }

      @if (enrollError()) {
        <div class="error-banner">{{ enrollError() }}</div>
      }

    </div>
  `,
  styles: [`
    .page {
      flex: 1;
      overflow-y: auto;
      padding: 32px;
      display: flex;
      flex-direction: column;
      gap: 40px;
    }

    .avail-row {
      padding: 14px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }

    .avail-info {
      display: flex;
      flex-direction: column;
      gap: 3px;
      flex: 1;
      min-width: 0;
    }

    .avail-name {
      font-family: ${DS.fonts.display};
      font-size: 1.0625rem;
      font-weight: 600;
      color: ${DS.colors.fg1};
    }

    .avail-meta {
      font-size: 0.8125rem;
      color: ${DS.colors.fg3};
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .error-banner {
      font-size: 0.8125rem;
      color: ${DS.colors.red};
      background: ${DS.colors.redSubtle};
      border: 1px solid ${DS.colors.redBorder};
      border-radius: 8px;
      padding: 10px 14px;
    }
  `],
})
export class ClassListComponent implements OnInit {
  private router        = inject(Router);
  private courseService = inject(CourseService);
  private enrollService = inject(EnrollService);
  private auth          = inject(AuthService);
  private loading       = inject(LoadingService);

  userCourses  = this.courseService.UserCourses;
  allClasses   = signal<Course[]>([]);
  enrollError  = signal<string | null>(null);

  availableClasses = computed(() => {
    const enrolled = new Set((this.userCourses() ?? []).map(c => c.id));
    return this.allClasses().filter(c => !enrolled.has(c.id));
  });

  ngOnInit() {
    this.courseService.getClasses().subscribe({
      next: (all) => this.allClasses.set(all),
      error: () => {},
    });
  }

  enrolledColumns = computed<ListColumn<Course>[]>(() => [
    { label: 'Class Name',  render: c => c.name },
    { label: 'Assignments', render: c => `${getAssignmentCount(c)} assignments` },
    { label: 'Threshold',   render: c => `${c.pass_threshold}% threshold` },
  ]);

  readonly trackFn = (c: Course) => c.id;

  readonly badge: ListBadge<Course> = {
    show: c => hasPassedCourse(c),
    variant: 'validated',
    label: 'PASSED',
  };

  readonly progressFn = (c: Course): ListProgressData | null => {
    const total = getAssignmentCount(c);
    if (total === 0) return null;
    return { value: c.done, max: total, label: getProgressLabel(c) };
  };

  enroll(course: Course) {
    const userId = this.auth.user()?.id;
    if (!userId) return;
    this.enrollError.set(null);
    this.loading.show();
    this.enrollService.enrollStudent({ classId: course.id, studentId: userId }).subscribe({
      next: () => {
        this.enrollService.getStudenEnrolledClasses(userId).subscribe({
          next: (courses) => {
            this.courseService.setUserCourses(courses);
            this.loading.hide();
            this.router.navigate(['/assignment'], { queryParams: { classId: course.id } });
          },
          error: () => this.loading.hide(),
        });
      },
      error: (err) => {
        this.enrollError.set(err?.error?.message ?? 'Failed to enroll. Please try again.');
        this.loading.hide();
      },
    });
  }

  navigate(courseId: number) {
    this.router.navigate(['/assignment'], { queryParams: { classId: courseId } });
  }
}
