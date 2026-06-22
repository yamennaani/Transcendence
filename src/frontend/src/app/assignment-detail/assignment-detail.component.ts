import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AuthService } from '../services/auth.service';
import { CourseService } from '../core/services/course-service/course-service';
import { AssignmentService, AssignmentResponse } from '../core/services/course-service/Assignment.service';
import { GroupService } from '../core/services/group-service/group-service';
import { SubmissionService } from '../core/services/submission-service/submission-service';
import { EnrollService } from '../core/services/enroll-service/enroll-service';
import { LoadingService } from '../core/services/loading-service/loading.service';
import { Group, DS, Submission } from '../tokens';

import { ContainerComponent, ContainerConfig } from '../shared/container.component';
import { BadgeComponent } from '../shared/badge.component';
import { BtnComponent } from '../shared/btn.component';
import { AvatarComponent } from '../shared/avatar.component';
import { ScorePillComponent } from '../shared/score-pill.component';

@Component({
  selector: 'app-assignment-detail',
  standalone: true,
  imports: [DecimalPipe, ContainerComponent, BadgeComponent, BtnComponent, AvatarComponent, ScorePillComponent, TranslateModule],
  templateUrl: './assignment-detail.component.html',
  styles: [`
    .page {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding: 32px;
      max-width: 860px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
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
    .mono-tag-cyan {
      color: ${DS.colors.cyan};
      background: ${DS.colors.cyanSubtle};
      border-color: ${DS.colors.cyanBorder};
    }
    .mono-tag-amber {
      color: ${DS.colors.amber};
      background: ${DS.colors.amberSubtle};
      border-color: ${DS.colors.amberBorder};
    }
    .mono-tag-violet {
      color: ${DS.colors.violet};
      background: ${DS.colors.violetSubtle};
      border-color: ${DS.colors.violetBorder};
    }
    .mono-tag-green {
      color: ${DS.colors.green};
      background: ${DS.colors.greenSubtle};
      border-color: ${DS.colors.greenBorder};
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
    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      align-items: stretch;
    }
    .two-col app-container {
      display: flex;
      flex-direction: column;
    }
    .two-col app-container ::ng-deep > div {
      flex: 1;
      min-height: 0;
    }
    .card-inner {
      padding: 18px 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      height: 100%;
      box-sizing: border-box;
    }
    .card-inner .action-row {
      margin-top: auto;
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
    .submission-card { gap: 16px; }
    .sub-status-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .upload-panel {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 14px 16px;
      border: 1px solid ${DS.colors.border};
      border-radius: ${DS.radius.lg};
      background: ${DS.colors.surface};
      margin-top: auto;
    }
    .upload-label {
      font-size: 0.6875rem;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: ${DS.colors.fg3};
    }
    .upload-help {
      margin: 0;
      font-size: 0.8125rem;
      color: ${DS.colors.fg3};
      line-height: 1.5;
    }
    .upload-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
    }
    .upload-picker {
      position: relative;
      overflow: hidden;
      display: inline-flex;
    }
    .file-input {
      position: absolute;
      inset: 0;
      opacity: 0;
      cursor: pointer;
      font-size: 0;
    }
    .upload-error {
      font-size: 0.8125rem;
      color: ${DS.colors.red};
      background: ${DS.colors.redSubtle};
      border: 1px solid ${DS.colors.redBorder};
      border-radius: ${DS.radius.md};
      padding: 9px 12px;
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
    .section-title {
      font-family: ${DS.fonts.display};
      font-size: 1rem;
      font-weight: 600;
      color: ${DS.colors.fg1};
      margin: 0;
    }
    .action-row { display: flex; gap: 8px; flex-wrap: wrap; }
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
    .file-preview {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border-radius: ${DS.radius.md};
      border: 1px solid ${DS.colors.cyanBorder};
      background: ${DS.colors.cyanSubtle};
    }
    .file-preview-ext {
      flex-shrink: 0;
      width: 36px;
      height: 36px;
      border-radius: 6px;
      background: ${DS.colors.cyan};
      color: ${DS.colors.bg};
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: ${DS.fonts.mono};
      font-size: 0.625rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .file-preview-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
      flex: 1;
    }
    .file-preview-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: ${DS.colors.fg1};
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .file-preview-meta {
      font-size: 0.75rem;
      color: ${DS.colors.fg3};
      font-family: ${DS.fonts.mono};
    }
    .file-preview-clear {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: 1px solid ${DS.colors.border};
      color: ${DS.colors.fg3};
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 120ms;
    }
    .file-preview-clear:hover {
      background: ${DS.colors.redSubtle};
      border-color: ${DS.colors.redBorder};
      color: ${DS.colors.red};
    }
  `],
})
export class AssignmentDetailComponent implements OnInit {
  private readonly allowedSubmissionMimeTypes = new Set([
    'application/zip', 'application/x-zip-compressed', 'application/pdf',
    'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]);
  private readonly maxSubmissionFileSize = 50 * 1024 * 1024;

  private auth          = inject(AuthService);
  private route         = inject(ActivatedRoute);
  private translate     = inject(TranslateService);
  router                = inject(Router);
  private assService    = inject(AssignmentService);
  private courseService = inject(CourseService);
  private groupService  = inject(GroupService);
  private subService    = inject(SubmissionService);
  private enrollService = inject(EnrollService);
  private loading       = inject(LoadingService);

  readonly role    = this.auth.role;
  readonly user    = this.auth.user;
  readonly isStaff = computed(() => this.role() === 'Bocal' || this.role() === 'Admin');

  isEnrolled  = signal(false);
  viewAsStaff = computed(() => this.isStaff() && !this.isEnrolled());

  assignment    = signal<AssignmentResponse | null>(null);
  className     = signal<string | null>(null);
  notFound      = signal(false);

  // Student state
  myGroup         = signal<Group | null>(null);
  mySubmission    = signal<Submission | null>(null);
  myInvites       = signal<any[]>([]);
  actionError     = signal<string | null>(null);
  submissionError = signal<string | null>(null);
  selectedFile = signal<File | null>(null);
  uploadingFile = signal(false);
  uploadedFileMeta = signal<{ name: string; size: string; ext: string; type: string } | null>(null);
  groupName    = signal<string>('');

  // Staff state
  allSubs = signal<Submission[]>([]);

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

  evalSlots      = computed(() => Array.from({ length: this.assignment()?.req_eval ?? 3 }, (_, i) => i));
  completedEvals = computed(() => this.mySubmission()?.responses?.length ?? 0);

  selectedFileMeta = computed(() => {
    const file = this.selectedFile();
    if (!file) return null;
    return {
      name: file.name,
      size: this.formatFileSize(file.size),
      ext: file.name.includes('.') ? file.name.split('.').pop()!.toUpperCase() : '?',
      type: file.type || 'unknown',
    };
  });

  private currentUserId() {
    const user = this.user() as { id?: number; userId?: number } | null;
    return user?.id ?? user?.userId ?? null;
  }

  submittedFileMeta(submission: Submission | null) {
    const local = this.uploadedFileMeta();
    if (local) return local;
    const file = submission?.file;
    if (!file) return null;
    return {
      name: file.name,
      size: this.formatFileSize(file.size),
      ext: file.name.includes('.') ? file.name.split('.').pop()!.toUpperCase() : '?',
      type: file.mimiType || 'unknown',
    };
  }

  staffGroupCount = computed(() => new Set(this.allSubs().map((s) => s.groupId)).size);
  staffSubmittedCount = computed(() => this.allSubs().filter((s) => s.status === 'Close').length);
  staffAvgScore = computed(() => {
    const scored = this.allSubs().filter((s) => s.finalScore != null);
    if (!scored.length) return null;
    return Math.round(scored.reduce((a, s) => a + (s.finalScore ?? 0), 0) / scored.length);
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
                  const existingSubmission = subs.find(sub => sub.groupId === group.id);
                  if (existingSubmission) {
                    this.mySubmission.set(existingSubmission);
                  }
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
    const userId = this.currentUserId();
    if (!a || !userId) return;
    this.actionError.set(null);
    this.submissionError.set(null);
    this.loading.show();
    this.groupService.createGroup({
      assId: a.id, userId,
      name: `${this.user()?.username ?? 'My'}'s work`,
      size: 1,
    }).subscribe({
      next: (group: any) => {
        this.groupService.getGroup(group.id).subscribe({
          next: (full: any) => { this.myGroup.set(full); this.loading.hide(); },
          error: ()         => { this.myGroup.set(group); this.loading.hide(); },
        });
      },
      error: (err) => {
        this.actionError.set(err?.error?.error ?? err?.error?.message ?? this.translate.instant('error_join_assignment_failed'));
        this.loading.hide();
      },
    });
  }

  goToEvalAssignments(): void {
    const a = this.assignment();
    if (!a) return;
    this.router.navigate(['/eval-assignments'], { queryParams: { assignmentId: a.id } });
  }

  createGroup() {
    const a = this.assignment();
    const userId = this.currentUserId();
    const name = this.groupName().trim();
    if (!a || !userId) return;
    if (!name) { this.actionError.set(this.translate.instant('error_group_name_required')); return; }
    this.actionError.set(null);
    this.submissionError.set(null);
    this.loading.show();
    this.groupService.createGroup({ assId: a.id, userId, name, size: a.groupSize ?? 1 }).subscribe({
      next: (group: any) => {
        this.groupName.set('');
        this.groupService.getGroup(group.id).subscribe({
          next: (full: any) => { this.myGroup.set(full); this.loading.hide(); },
          error: ()         => { this.myGroup.set(group); this.loading.hide(); },
        });
      },
      error: (err) => {
        this.actionError.set(err?.error?.error ?? err?.error?.message ?? this.translate.instant('error_create_group_failed'));
        this.loading.hide();
      },
    });
  }

  acceptInvite(inviteId: number) {
    const userId = this.currentUserId();
    if (!userId) return;
    this.actionError.set(null);
    this.submissionError.set(null);
    this.loading.show();
    this.groupService.respondToInvite(inviteId, { userId, status: 'Accepted' }).subscribe({
      next: (res: any) => {
        if (res.group) this.myGroup.set(res.group);
        this.myInvites.set([]);
        this.loading.hide();
      },
      error: (err) => {
        this.actionError.set(err?.error?.error ?? err?.error?.message ?? this.translate.instant('error_accept_invite_failed'));
        this.loading.hide();
      },
    });
  }

  declineInvite(inviteId: number) {
    const userId = this.currentUserId();
    if (!userId) return;
    this.groupService.respondToInvite(inviteId, { userId, status: 'Declined' }).subscribe({
      next: () => this.myInvites.update(inv => inv.filter(i => i.id !== inviteId)),
      error: () => {},
    });
  }

  startSubmission() {
    const a = this.assignment();
    const group = this.myGroup();
    const userId = this.currentUserId();
    if (!a || !group || !userId) return;
    this.actionError.set(null);
    this.submissionError.set(null);
    this.selectedFile.set(null);
    this.loading.show();
    this.subService.createSubmission({ groupId: group.id, userId, type: 'FILE' }).subscribe({
      next: (sub) => { this.mySubmission.set(sub); this.loading.hide(); },
      error: (err) => {
        const body = err?.error ?? err?.message ?? err;
        this.actionError.set(typeof body === 'string' ? body : JSON.stringify(body));
        this.loading.hide();
      },
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';
    if (!file) return;
    this.actionError.set(null);
    this.submissionError.set(null);
    const validationError = this.validateSubmissionFile(file);
    if (validationError) {
      this.selectedFile.set(null);
      this.submissionError.set(validationError);
      return;
    }
    this.selectedFile.set(file);
    this.uploadSelectedFile();
  }

  uploadSelectedFile() {
    const file = this.selectedFile();
    const group = this.myGroup();
    const userId = this.currentUserId();
    if (!file || !group || !userId) return;

    const meta = this.selectedFileMeta();
    this.actionError.set(null);
    this.submissionError.set(null);
    this.uploadingFile.set(true);
    this.loading.show();
    this.subService.uploadFile(group.id, userId, file).subscribe({
      next: (sub) => {
        this.mySubmission.set(sub);
        this.selectedFile.set(null);
        this.uploadedFileMeta.set(meta);
        this.uploadingFile.set(false);
        this.loading.hide();
      },
      error: (err) => {
        const body = err?.error ?? err?.message ?? err;
        this.submissionError.set(typeof body === 'string' ? body : JSON.stringify(body));
        this.uploadingFile.set(false);
        this.loading.hide();
      },
    });
  }

  closeSubmission() {
    const group = this.myGroup();
    const userId = this.currentUserId();
    if (!group || !userId) return;
    if (!confirm('Are you sure you want to close this submission? You won\'t be able to upload further files afterwards.')) return;
    this.actionError.set(null);
    this.submissionError.set(null);
    this.loading.show();
    this.subService.closeSubmission(group.id, { userId }).subscribe({
      next: (sub) => { this.mySubmission.set(sub); this.loading.hide(); },
      error: (err) => {
        this.actionError.set(err?.error?.error ?? err?.error?.message ?? this.translate.instant('error_close_submission_failed'));
        this.loading.hide();
      },
    });
  }

  private validateSubmissionFile(file: File): string | null {
    if (!this.allowedSubmissionMimeTypes.has(file.type)) {
      return this.translate.instant('error_unsupported_file_type');
    }
    if (file.size > this.maxSubmissionFileSize) {
      return this.translate.instant('error_file_too_large');
    }
    return null;
  }

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