import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Course, DS } from '../tokens';
import { AssignmentResponse } from '../core/services/course-service/Assignment.service';
import { CourseService } from '../core/services/course-service/course-service';
import { EnrollService } from '../core/services/enroll-service/enroll-service';
import { AuthService } from '../services/auth.service';
import { LoadingService } from '../core/services/loading-service/loading.service';
import { ListComponent } from '../shared/list.component';
import { SlicePipe } from '@angular/common';
import { BtnComponent } from '../shared/btn.component';
import { BadgeComponent } from '../shared/badge.component';
import { ProgressBarComponent } from '../shared/progress-bar.component';
import { hasPassedCourse, getProgressLabel, getAssignmentCount } from '../utilities/course-utilities';

@Component({
  selector: 'app-class-list',
  standalone: true,
  imports: [ListComponent, BtnComponent, BadgeComponent, ProgressBarComponent, SlicePipe],
  template: `
    <div class="page">

      <!-- ── Enrolled classes ──────────────────────────────── -->
      <app-list
        [items]="userCourses()"
        [trackBy]="trackFn"
        title="My classes"
        overline="Enrolled"
        emptyMessage="You haven't enrolled in any class yet."
        [pageSize]="8">
        <ng-template let-course>
          <div class="course-row">
            <div class="course-row__main" (click)="toggleAssignments(course)">
              <div class="course-row__head">
                <span class="course-name">{{ course.name }}</span>
                @if (hasPassed(course)) {
                  <app-badge variant="validated" customLabel="PASSED"/>
                }
              </div>
              <span class="course-meta">
                {{ assignmentCount(course) }} assignment{{ assignmentCount(course) === 1 ? '' : 's' }}
                · {{ course.pass_threshold }}% threshold
                @if (course.description) { · {{ course.description | slice:0:60 }}{{ course.description.length > 60 ? '…' : '' }} }
              </span>
              @if (assignmentCount(course) > 0) {
                <app-progress-bar [value]="course.done" [max]="assignmentCount(course)" [sublabel]="progressLabel(course)"/>
              }
            </div>
            <app-btn variant="ghost" size="sm" (clicked)="toggleAssignments(course)">
              {{ expandedClass() === course.id ? 'Hide assignments' : 'Assignments' }}
            </app-btn>
          </div>

          @if (expandedClass() === course.id) {
            <div class="assignment-drawer">
              @if (assignmentCount(course) === 0) {
                <div class="assignment-empty">No assignments in this class yet.</div>
              } @else {
                @for (a of course.assignments; track a.id) {
                  <div class="assignment-row">
                    <div class="assignment-info">
                      <span class="assignment-name">{{ a.name }}</span>
                      <span class="assignment-meta">
                        {{ a.max_score }} pts · {{ a.req_eval }} evals required
                        @if (a.pass_threshold) { · {{ a.pass_threshold }}% threshold }
                      </span>
                    </div>
                    <app-btn variant="ghost" size="sm" (clicked)="openAssignment(a)">Open →</app-btn>
                  </div>
                }
              }
            </div>
          }
        </ng-template>
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

    .course-row {
      padding: 14px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }

    .course-row__main {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
      min-width: 0;
      cursor: pointer;
    }

    .course-row__head {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .course-name {
      font-family: ${DS.fonts.display};
      font-size: 1.0625rem;
      font-weight: 600;
      color: ${DS.colors.fg1};
    }

    .course-meta {
      font-size: 0.8125rem;
      color: ${DS.colors.fg3};
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .assignment-drawer {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 4px 18px 16px;
      border-top: 1px solid ${DS.colors.borderSubtle};
    }

    .assignment-empty {
      padding-top: 12px;
      font-size: 0.8125rem;
      color: ${DS.colors.fg3};
    }

    .assignment-row {
      padding-top: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }

    .assignment-info {
      display: flex;
      flex-direction: column;
      gap: 3px;
      min-width: 0;
    }

    .assignment-name {
      font-size: 0.9375rem;
      font-weight: 600;
      color: ${DS.colors.fg1};
    }

    .assignment-meta {
      font-size: 0.8125rem;
      color: ${DS.colors.fg3};
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
    const orgId = this.auth.user()?.orgId;
    if (!orgId) return;

    this.courseService.getClassByOrgId(orgId).subscribe({
      next: (all) => this.allClasses.set(all),
      error: () => {},
    });

    if (this.userCourses() === null) {
      const userId = this.auth.user()?.id;
      if (!userId) return;
      this.enrollService.getStudenEnrolledClasses(userId).subscribe({
        next: (courses) => this.courseService.setUserCourses(courses),
        error: () => {},
      });
    }
  }

  readonly trackFn = (c: Course) => c.id;

  hasPassed(course: Course)       { return hasPassedCourse(course); }
  assignmentCount(course: Course) { return getAssignmentCount(course); }
  progressLabel(course: Course)   { return getProgressLabel(course); }

  // ── Inline assignment expansion ────────────────────────────
  expandedClass = signal<number | null>(null);

  toggleAssignments(course: Course) {
    this.expandedClass.update(id => id === course.id ? null : course.id);
  }

  openAssignment(a: AssignmentResponse) {
    this.router.navigate(['/assignment-detail'], { queryParams: { assId: a.id } });
  }

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
}
