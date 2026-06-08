import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { CourseService } from '../core/services/course-service/course-service';
import { AssignmentService, AssignmentResponse } from '../core/services/course-service/Assignment.service';
import { GroupService } from '../core/services/group-service/group-service';
import { SubmissionService } from '../core/services/submission-service/submission-service';
import { EnrollService } from '../core/services/enroll-service/enroll-service';
import { LoadingService } from '../core/services/loading-service/loading.service';
import { Group, DS } from '../tokens';

import { ContainerComponent, ContainerConfig } from '../shared/container.component';
import { BadgeComponent } from '../shared/badge.component';
import { BtnComponent } from '../shared/btn.component';
import { AvatarComponent } from '../shared/avatar.component';
import { ScorePillComponent } from '../shared/score-pill.component';

@Component({
  selector: 'app-assignment-detail',
  standalone: true,
  imports: [DecimalPipe, ContainerComponent, BadgeComponent, BtnComponent, AvatarComponent, ScorePillComponent],
  templateUrl: './assignment-detail.component.html',
  styles: [`
    .page {
      flex: 1;
      overflow-y: auto;
      padding: 32px;
      max-width: 860px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* Breadcrumb */
    .crumb {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8125rem;
      color: ${DS.colors.fg3};
    }
    .crumb-link {
      color: ${DS.colors.violet};
      cursor: pointer;
      transition: opacity 120ms;
    }
    .crumb-link:hover { opacity: 0.75; }

    /* Hero */
    .hero {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
      flex-wrap: wrap;
    }
    .hero-title {
      margin: 0 0 10px;
      font-family: ${DS.fonts.display};
      font-size: 2rem;
      font-weight: 700;
      letter-spacing: -0.03em;
      color: ${DS.colors.fg1};
      line-height: 1.15;
    }
    .hero-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }
    .mono-tag {
      font-family: ${DS.fonts.mono};
      font-size: 0.75rem;
      color: ${DS.colors.fg3};
      background: ${DS.colors.surfaceRaised};
      border: 1px solid ${DS.colors.border};
      border-radius: 6px;
      padding: 2px 8px;
    }

    /* Stats grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1px;
      background: ${DS.colors.border};
      border: 1px solid ${DS.colors.border};
      border-radius: ${DS.radius.lg};
      overflow: hidden;
      flex-shrink: 0;
      min-width: 220px;
    }
    .stat-cell {
      background: ${DS.colors.surface};
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .stat-label {
      font-size: 0.6875rem;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: ${DS.colors.fg3};
    }
    .stat-value {
      font-family: ${DS.fonts.mono};
      font-size: 1.125rem;
      font-weight: 600;
      color: ${DS.colors.cyan};
    }

    /* Subject file */
    .subject-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 20px;
    }
    .subject-info { display: flex; align-items: center; gap: 10px; min-width: 0; }
    .subject-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: ${DS.radius.md};
      background: ${DS.colors.violetSubtle};
      border: 1px solid ${DS.colors.violetBorder};
      color: ${DS.colors.violet};
      flex-shrink: 0;
    }
    .subject-name {
      font-size: 0.9375rem;
      font-weight: 500;
      color: ${DS.colors.fg1};
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .subject-meta {
      font-size: 0.75rem;
      color: ${DS.colors.fg3};
    }

    /* Description */
    .desc-body { padding: 18px 20px; }
    .desc-label {
      font-size: 0.6875rem;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: ${DS.colors.violet};
      margin-bottom: 8px;
    }
    .desc-text {
      margin: 0;
      font-size: 0.9375rem;
      color: ${DS.colors.fg2};
      line-height: 1.75;
    }

    /* Two-column grid */
    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    /* Card body (inside container) */
    .card-inner {
      padding: 18px 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      height: 100%;
      box-sizing: border-box;
    }
    .card-title {
      font-size: 0.6875rem;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: ${DS.colors.fg3};
      margin-bottom: 2px;
    }
    .hint-text {
      margin: 0;
      font-size: 0.875rem;
      color: ${DS.colors.fg3};
    }

    /* Group card */
    .members-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .member-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      border-radius: 8px;
      background: ${DS.colors.bg};
    }
    .member-name {
      font-size: 0.875rem;
      color: ${DS.colors.fg1};
      font-weight: 500;
      flex: 1;
    }

    /* Invite card */
    .invite-item {
      padding: 10px 12px;
      border-radius: 8px;
      background: ${DS.colors.violetSubtle};
      border: 1px solid ${DS.colors.violetBorder};
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
    }
    .invite-from {
      font-size: 0.8125rem;
      color: ${DS.colors.fg3};
    }
    .invite-btns { display: flex; gap: 6px; }

    /* Submission card */
    .sub-status-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .upload-btn-wrap { position: relative; overflow: hidden; display: inline-flex; }
    .file-input {
      position: absolute;
      inset: 0;
      opacity: 0;
      cursor: pointer;
      font-size: 0;
    }

    /* Eval progress */
    .eval-inner {
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 20px;
      flex-wrap: wrap;
    }
    .eval-dots {
      display: flex;
      align-items: center;
      gap: 0;
    }
    .eval-dot {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: ${DS.fonts.mono};
      font-size: 0.75rem;
      font-weight: 600;
      background: ${DS.colors.surfaceRaised};
      border: 1.5px solid ${DS.colors.border};
      color: ${DS.colors.fg3};
      transition: all 200ms;
    }
    .eval-dot.done {
      background: ${DS.colors.greenSubtle};
      border-color: ${DS.colors.greenBorder};
      color: ${DS.colors.green};
    }
    .eval-connector {
      width: 20px;
      height: 2px;
      background: ${DS.colors.border};
    }
    .eval-connector.done { background: ${DS.colors.greenBorder}; }
    .eval-summary {
      font-size: 0.875rem;
      color: ${DS.colors.fg2};
    }
    .eval-pct {
      font-family: ${DS.fonts.mono};
      font-size: 0.875rem;
      color: ${DS.colors.fg3};
      margin-left: auto;
    }

    /* Staff: stats row */
    .staff-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    .sstat {
      padding: 16px 18px;
      background: ${DS.colors.surface};
      border: 1px solid ${DS.colors.border};
      border-radius: ${DS.radius.lg};
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .sstat-label {
      font-size: 0.6875rem;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: ${DS.colors.fg3};
    }
    .sstat-value {
      font-family: ${DS.fonts.display};
      font-size: 1.75rem;
      font-weight: 700;
      letter-spacing: -0.03em;
      color: ${DS.colors.fg1};
    }

    /* Staff: submission row */
    .sub-row {
      padding: 14px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .sub-row-left { display: flex; align-items: center; gap: 10px; }
    .sub-group-name { font-weight: 600; color: ${DS.colors.fg1}; font-size: 0.9375rem; }
    .sub-members { font-size: 0.8125rem; color: ${DS.colors.fg3}; }
    .sub-row-right { display: flex; align-items: center; gap: 12px; }

    /* Not found */
    .not-found {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      overflow-y: auto;
      padding: 32px;
    }
    .not-found-icon { font-size: 3rem; margin-bottom: 12px; }
    .not-found-title { font-family: ${DS.fonts.display}; font-size: 1.25rem; font-weight: 600; color: ${DS.colors.fg1}; margin-bottom: 6px; }
    .not-found-sub { font-size: 0.875rem; color: ${DS.colors.fg3}; margin-bottom: 20px; }

    /* Section title */
    .section-title {
      font-family: ${DS.fonts.display};
      font-size: 1rem;
      font-weight: 600;
      color: ${DS.colors.fg1};
      margin: 0;
    }

    /* Action row */
    .action-row { display: flex; gap: 8px; flex-wrap: wrap; }

    /* Group name input */
    .name-input {
      width: 100%;
      box-sizing: border-box;
      padding: 9px 12px;
      background: ${DS.colors.bg};
      border: 1px solid ${DS.colors.border};
      border-radius: ${DS.radius.md};
      color: ${DS.colors.fg1};
      font-family: ${DS.fonts.body};
      font-size: 0.875rem;
      outline: none;
      transition: border-color 150ms;
    }
    .name-input::placeholder { color: ${DS.colors.fg3}; }
    .name-input:focus { border-color: ${DS.colors.violet}; }
  `],
})
export class AssignmentDetailComponent implements OnInit {
  private auth         = inject(AuthService);
  private route        = inject(ActivatedRoute);
  router               = inject(Router);
  private assService   = inject(AssignmentService);
  private courseService = inject(CourseService);
  private groupService = inject(GroupService);
  private subService   = inject(SubmissionService);
  private enrollService = inject(EnrollService);
  private loading      = inject(LoadingService);

  readonly role    = this.auth.role;
  readonly user    = this.auth.user;
  readonly isStaff = computed(() => this.role() === 'Bocal' || this.role() === 'Admin');

  // A Bocal/Admin can also be enrolled as a participant in a class they don't manage
  // (e.g. another org's class) — in that case show them the student view for it.
  isEnrolled  = signal(false);
  viewAsStaff = computed(() => this.isStaff() && !this.isEnrolled());

  assignment   = signal<AssignmentResponse | null>(null);
  className    = signal<string | null>(null);
  notFound     = signal(false);

  // Student state
  myGroup      = signal<Group | null>(null);
  mySubmission = signal<any | null>(null);
  myInvites    = signal<any[]>([]);
  actionError  = signal<string | null>(null);
  groupName    = signal<string>('');

  // Staff state
  allSubs      = signal<any[]>([]);

  groupStatus = computed<'no-group' | 'has-invites' | 'in-group'>(() => {
    if (this.myGroup()) return 'in-group';
    if (this.myInvites().length > 0) return 'has-invites';
    return 'no-group';
  });

  statusBadge = computed(() => {
    const sub = this.mySubmission();
    if (!sub) return 'pending' as const;
    if (sub.status === 'Close' && (sub.responses?.length ?? 0) >= (this.assignment()?.req_eval ?? 1)) {
      return sub.passed ? 'validated' as const : 'failed' as const;
    }
    if (sub.status === 'Close') return 'under_review' as const;
    return 'submitted' as const;
  });

  evalSlots     = computed(() => Array.from({ length: this.assignment()?.req_eval ?? 3 }, (_, i) => i));
  completedEvals = computed(() => this.mySubmission()?.responses?.length ?? 0);

  staffGroupCount = computed(() => new Set(this.allSubs().map((s: any) => s.groupId)).size);
  staffSubmittedCount = computed(() => this.allSubs().filter((s: any) => s.status === 'Close').length);
  staffAvgScore = computed(() => {
    const scored = this.allSubs().filter((s: any) => s.finalScore != null);
    if (!scored.length) return null;
    return Math.round(scored.reduce((a: number, s: any) => a + s.finalScore, 0) / scored.length);
  });

  readonly flatConfig: ContainerConfig = { variant: 'flat', height: 'auto', scrollable: false };
  readonly cardConfig: ContainerConfig = { variant: 'card', height: 'auto', scrollable: false };

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const id = parseInt(params['assId'], 10);
      if (!id) { this.notFound.set(true); return; }
      this.load(id);
    });
  }

  private load(id: number) {
    this.loading.show();

    // Reset per-assignment state so stale data from a previously viewed assignment
    // doesn't leak in and hide the join/submission UI.
    this.myGroup.set(null);
    this.mySubmission.set(null);
    this.myInvites.set([]);
    this.allSubs.set([]);
    this.actionError.set(null);
    this.groupName.set('');
    this.isEnrolled.set(false);

    this.assService.getAssignmentById(id).subscribe({
      next: (a) => {
        this.assignment.set(a);
        this.courseService.getClass(a.classid).subscribe({
          next: (c) => this.className.set(c.name),
          error: () => {},
        });

        const userId = this.user()?.id;
        const enrollment$ = (this.isStaff() && userId)
          ? this.enrollService.getStudenEnrolledClasses(userId)
          : of([]);

        enrollment$.subscribe({
          next: (courses) => {
            if (this.isStaff()) this.isEnrolled.set(courses.some(c => c.id === a.classid));
            this.loadSubmissions(id);
          },
          error: () => this.loadSubmissions(id),
        });
      },
      error: () => { this.notFound.set(true); this.loading.hide(); },
    });
  }

  private loadSubmissions(id: number) {
    this.subService.getSubmissionsForAssignment(id).subscribe({
      next: (subs: any[]) => {
        if (this.viewAsStaff()) {
          this.allSubs.set(subs);
          this.loading.hide();
        } else {
          const userId = this.user()?.id;
          const mine = subs.find(s => s.group?.members?.some((m: any) => m.userId === userId));
          if (mine) {
            this.myGroup.set(mine.group);
            this.mySubmission.set(mine);
            this.loading.hide();
          } else if (userId) {
            this.groupService.getMyGroupForAssignment(userId, id).subscribe({
              next: (group: any) => {
                if (group) {
                  this.myGroup.set(group);
                  this.loading.hide();
                } else {
                  this.groupService.getInvites({ userId }).subscribe({
                    next: (invites) => { this.myInvites.set(invites); this.loading.hide(); },
                    error: () => this.loading.hide(),
                  });
                }
              },
              error: () => {
                this.groupService.getInvites({ userId }).subscribe({
                  next: (invites) => { this.myInvites.set(invites); this.loading.hide(); },
                  error: () => this.loading.hide(),
                });
              },
            });
          } else {
            this.loading.hide();
          }
        }
      },
      error: () => this.loading.hide(),
    });
  }

  joinSoloAssignment() {
    const a = this.assignment();
    const user = this.user();
    if (!a || !user) return;
    this.actionError.set(null);
    this.loading.show();
    this.groupService.createGroup({
      assId: a.id,
      userId: user.id,
      name: `${user.username}'s work`,
      size: 1,
    }).subscribe({
      next: (group: any) => {
        this.groupService.getGroup(group.id).subscribe({
          next: (full: any) => { this.myGroup.set(full); this.loading.hide(); },
          error: ()         => { this.myGroup.set(group); this.loading.hide(); },
        });
      },
      error: (err) => {
        this.actionError.set(err?.error?.message ?? 'Failed to join assignment. Make sure you are enrolled in this class.');
        this.loading.hide();
      },
    });
  }

  createGroup() {
    const a = this.assignment();
    const userId = this.user()?.id;
    const name = this.groupName().trim();
    if (!a || !userId) return;
    if (!name) { this.actionError.set('Please enter a group name.'); return; }
    this.actionError.set(null);
    this.loading.show();
    this.groupService.createGroup({
      assId: a.id,
      userId,
      name,
      size: a.groupSize ?? 1,
    }).subscribe({
      next: (group: any) => {
        this.groupName.set('');
        this.groupService.getGroup(group.id).subscribe({
          next: (full: any) => { this.myGroup.set(full); this.loading.hide(); },
          error: ()         => { this.myGroup.set(group); this.loading.hide(); },
        });
      },
      error: (err) => {
        this.actionError.set(err?.error?.message ?? 'Failed to create group. Make sure you are enrolled in this class.');
        this.loading.hide();
      },
    });
  }

  acceptInvite(inviteId: number) {
    const userId = this.user()?.id;
    if (!userId) return;
    this.actionError.set(null);
    this.loading.show();
    this.groupService.respondToInvite(inviteId, { userId, status: 'Accepted' }).subscribe({
      next: (res: any) => {
        if (res.group) this.myGroup.set(res.group);
        this.myInvites.set([]);
        this.loading.hide();
      },
      error: (err) => {
        this.actionError.set(err?.error?.message ?? 'Failed to accept invite.');
        this.loading.hide();
      },
    });
  }

  declineInvite(inviteId: number) {
    const userId = this.user()?.id;
    if (!userId) return;
    this.groupService.respondToInvite(inviteId, { userId, status: 'Declined' }).subscribe({
      next: () => this.myInvites.update(inv => inv.filter(i => i.id !== inviteId)),
      error: () => {},
    });
  }

  startSubmission() {
    const a = this.assignment();
    const group = this.myGroup();
    if (!a || !group) return;
    this.actionError.set(null);
    this.loading.show();
    this.subService.createSubmission({ groupId: group.id, assignmentId: a.id }).subscribe({
      next: (sub: any) => { this.mySubmission.set(sub); this.loading.hide(); },
      error: (err) => {
        this.actionError.set(err?.error?.message ?? 'Failed to start submission.');
        this.loading.hide();
      },
    });
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    const group = this.myGroup();
    const userId = this.user()?.id;
    if (!file || !group || !userId) return;
    this.actionError.set(null);
    this.loading.show();
    this.subService.uploadFile(group.id, userId, file).subscribe({
      next: (sub: any) => { this.mySubmission.set(sub); this.loading.hide(); },
      error: (err) => {
        this.actionError.set(err?.error?.message ?? 'Failed to upload file.');
        this.loading.hide();
      },
    });
  }

  closeSubmission() {
    const group = this.myGroup();
    const userId = this.user()?.id;
    if (!group || !userId) return;
    this.actionError.set(null);
    this.loading.show();
    this.subService.closeSubmission(group.id, { evaluatorId: userId }).subscribe({
      next: (sub: any) => { this.mySubmission.set(sub); this.loading.hide(); },
      error: (err) => {
        this.actionError.set(err?.error?.message ?? 'Failed to close submission.');
        this.loading.hide();
      },
    });
  }

  // Staff managing this class land back on the bocal management view (their own URL);
  // students — and staff merely enrolled as participants — go to "My classes".
  goToClasses() {
    if (this.viewAsStaff()) this.router.navigate(['/bocal/classes']);
    else this.router.navigate(['/classes']);
  }

  goToClass() {
    const a = this.assignment();
    if (!a) return;
    if (this.viewAsStaff()) this.router.navigate(['/bocal/classes'], { queryParams: { classId: a.classid } });
    else this.router.navigate(['/assignment'], { queryParams: { classId: a.classid } });
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  subStatusVariant(status: string): 'submitted' | 'validated' | 'under_review' | 'pending' {
    if (status === 'Open') return 'submitted';
    return 'under_review';
  }
}
