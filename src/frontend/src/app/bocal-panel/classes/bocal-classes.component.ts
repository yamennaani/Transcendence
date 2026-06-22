import { Component, inject, signal, OnInit } from '@angular/core';
import { NgStyle, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DS } from '../../tokens';
import { BtnComponent } from '../../shared/btn.component';
import { ContainerComponent, ContainerConfig } from '../../shared/container.component';
import { CreateClassPage } from '../../shared/CreateClassPage';
import { AuthService } from '../../services/auth.service';
import { CourseService } from '../../core/services/course-service/course-service';
import { AssignmentService, AssignmentResponse } from '../../core/services/course-service/Assignment.service';
import { GroupService } from '../../core/services/group-service/group-service';
import { LoadingService } from '../../core/services/loading-service/loading.service';



export interface AssignmentGroup {
  id: number;
  name: string;
  leaderId: number;
  members: { id: number; userId: number; user?: { id: number; username: string; email: string } }[];
}

export interface BocalClass {
  id: number;
  name: string;
  description: string;
  created_at: string;
  org_id: number;
  assignmentCount: number;
}

@Component({
  selector: 'app-bocal-classes',
  standalone: true,
  imports: [
    NgStyle, DatePipe,
    BtnComponent, ContainerComponent,
    CreateClassPage,
    TranslateModule,
  ],
  templateUrl: './bocal-classes.component.html',
})
export class BocalClassesComponent implements OnInit {
  private auth          = inject(AuthService);
  private courseService = inject(CourseService);
  private assignService = inject(AssignmentService);
  private groupService  = inject(GroupService);
  private loading       = inject(LoadingService);
  private route         = inject(ActivatedRoute);
  private translate     = inject(TranslateService);
  router = inject(Router);

  // ── Modal visibility ───────────────────────────────────────
  showNew         = signal(false);
  showEditClass   = signal(false);

  // ── Data signals ───────────────────────────────────────────
  classes          = signal<BocalClass[]>([]);
  selectedClass    = signal<BocalClass | null>(null);
  classAssignments = signal<AssignmentResponse[]>([]);

  // ── Groups (per-assignment, lazily loaded) ─────────────────
  expandedAssignment = signal<number | null>(null);
  assignmentGroups   = signal<Map<number, AssignmentGroup[]>>(new Map());

  // ── Form error signals ─────────────────────────────────────
  editClassError  = signal<string | null>(null);

  // ── Edit class form state ──────────────────────────────────
  editClassName      = signal('');
  editClassDesc      = signal('');
  editClassThreshold = signal(80);

  // ── Container configs ──────────────────────────────────────
  readonly flatConfig: ContainerConfig   = { variant: 'flat',  height: 'auto', scrollable: false };
  readonly insetConfig: ContainerConfig  = { variant: 'inset', height: 'auto', scrollable: false };

  private get orgId() { return this.auth.user()?.orgId; }

  ngOnInit() {
    this.loadAll();

    // Build translated field labels initially and whenever the language changes
    this.translate.onLangChange.subscribe(() => {
      
    });

    // Keep the selected class in sync with the `classId` query param so that
    // viewing/managing a class has its own URL (and the back button + breadcrumbs work).
    this.route.queryParams.subscribe(params => {
      const classId = parseInt(params['classId'], 10);
      if (!classId) { this.selectedClass.set(null); return; }
      if (this.selectedClass()?.id === classId) return;

      const cached = this.classes().find(c => c.id === classId);
      if (cached) this.openClass(cached);
      else this.pendingClassId = classId;
    });
  }

  private pendingClassId: number | null = null;

  loadAll() {
    const orgId = this.orgId;
    if (!orgId) return;

    this.loading.show();
    this.courseService.getClassByOrgId(orgId).subscribe({
      next: (courses) => {
        if (courses.length === 0) {
          this.classes.set([]);
          this.loading.hide();
          return;
        }

        forkJoin(courses.map((c: any) => this.assignService.getAssignments(c.id))).subscribe({
          next: (allAssignments: any) => {
            this.classes.set(courses.map((c, i) => ({
              id: c.id, name: c.name, description: c.description,
              created_at: c.created_at, org_id: c.org_id,
              assignmentCount: (allAssignments[i] as any[]).length,
            })));
            this.loading.hide();
            this.applyPendingClass();
          },
          error: () => {
            this.classes.set(courses.map(c => ({ ...c, assignmentCount: 0 })));
            this.loading.hide();
            this.applyPendingClass();
          },
        });
      },
      error: () => this.loading.hide(),
    });
  }

  private applyPendingClass() {
    if (this.pendingClassId == null) return;
    const cls = this.classes().find(c => c.id === this.pendingClassId);
    this.pendingClassId = null;
    if (cls) this.openClass(cls);
  }

  // ── Assignment viewing ─────────────────────────────────────
  /** Opens the (student-facing) assignment-detail page in a new tab so the bocal panel stays put. */
  viewAssignment(a: AssignmentResponse) {
    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/assignment-detail'], { queryParams: { assId: a.id } })
    );
    window.open(url, '_blank', 'noopener');
  }

  // ── Class selection ────────────────────────────────────────
  /** Selects a class and gives it its own URL via the `classId` query param. */
  selectClass(c: BocalClass) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { classId: c.id },
      queryParamsHandling: 'merge',
    });
  }

  /** Loads a class's assignments and shows its detail view (does not touch the URL). */
  private openClass(c: BocalClass) {
    this.selectedClass.set(c);
    this.loading.show();
    this.assignService.getAssignments(c.id).subscribe({
      next: (list) => { this.classAssignments.set(list); this.loading.hide(); },
      error: ()     =>   this.loading.hide(),
    });
  }

  backToClasses() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { classId: null },
      queryParamsHandling: 'merge',
    });
  }

  addAssignment() {
    const cls = this.selectedClass();
    if (!cls) return;
    this.router.navigate(['/bocal/assignment-create'], { queryParams: { classId: cls.id } });
  }

  // ── Create class ───────────────────────────────────────────
  onClassCreated() {
    this.showNew.set(false);
    this.loadAll();
  }

  // ── Edit class ─────────────────────────────────────────────
  openEditClass() {
    const cls = this.selectedClass();
    if (!cls) return;
    this.editClassName.set(cls.name);
    this.editClassDesc.set(cls.description ?? '');
    this.editClassThreshold.set(80);
    this.editClassError.set(null);
    this.showEditClass.set(true);
  }

  closeEditClassModal() {
    this.showEditClass.set(false);
    this.editClassError.set(null);
  }

  onSaveClassEdit() {
    const cls  = this.selectedClass();
    const user = this.auth.user();
    const name = this.editClassName().trim();
    const desc = this.editClassDesc().trim();

    if (!cls || !user) return;
    if (!name) { this.editClassError.set(this.translate.instant('error_class_name_required')); return; }
    if (!desc) { this.editClassError.set(this.translate.instant('error_description_required')); return; }

    this.editClassError.set(null);
    this.loading.show();
    this.courseService.updateClass(cls.id, {
      org_id: cls.org_id,
      created_by: user.id,
      name,
      description: desc,
      pass_threshold: this.editClassThreshold(),
    }).subscribe({
      next: () => {
        this.classes.update(list => list.map(c =>
          c.id === cls.id ? { ...c, name, description: desc } : c
        ));
        this.selectedClass.update(c => c ? { ...c, name, description: desc } : c);
        this.closeEditClassModal();
        this.loading.hide();
      },
      error: (err) => {
        this.editClassError.set(err?.error?.message ?? this.translate.instant('error_update_class_failed'));
        this.loading.hide();
      },
    });
  }

  // ── Edit assignment ────────────────────────────────────────
  /** Opens the merged assignment + eval sheet editor, pre-filled for this assignment. */
  openEditAssignment(a: AssignmentResponse) {
    this.router.navigate(['/bocal/assignment-create'], { queryParams: { assId: a.id } });
  }

  // --Assignment count label with proper pluralization──
  assignmentCountLabel(c: { assignmentCount: number }): string {
  const count = c.assignmentCount;
  const key = count === 1 ? 'class_list_assignment_singular' : 'class_list_assignment_plural';
  return this.translate.instant(key, { count });
  }

  // ── Delete class ───────────────────────────────────────────
  deleteClass(c: BocalClass) {
    if (!confirm(this.translate.instant('confirm_delete_class', { name: c.name }))) return;

    this.loading.show();
    this.courseService.deleteClass(c.id).subscribe({
      next: () => {
        this.classes.update(list => list.filter(x => x.id !== c.id));
        if (this.selectedClass()?.id === c.id) this.backToClasses();
        this.loading.hide();
      },
      error: () => this.loading.hide(),
    });
  }

  // ── Delete assignment ──────────────────────────────────────
  deleteAssignment(a: AssignmentResponse) {
    const cls = this.selectedClass();
    if (!cls) return;
    if (!confirm(this.translate.instant('confirm_delete_assignment', { name: a.name }))) return;

    this.loading.show();
    this.assignService.deleteAssignment(a.id).subscribe({
      next: () => {
        this.classAssignments.update(list => list.filter(x => x.id !== a.id));
        this.classes.update(list => list.map(c =>
          c.id === cls.id ? { ...c, assignmentCount: Math.max(0, c.assignmentCount - 1) } : c
        ));
        this.assignmentGroups.update(map => { const m = new Map(map); m.delete(a.id); return m; });
        if (this.expandedAssignment() === a.id) this.expandedAssignment.set(null);
        this.loading.hide();
      },
      error: () => this.loading.hide(),
    });
  }

  // ── Groups management ──────────────────────────────────────
  toggleGroups(a: AssignmentResponse) {
    if (this.expandedAssignment() === a.id) {
      this.expandedAssignment.set(null);
      return;
    }
    this.expandedAssignment.set(a.id);
    if (this.assignmentGroups().has(a.id)) return;

    this.groupService.getGroupsForAssignment(a.id).subscribe({
      next: (groups) => this.assignmentGroups.update(map => {
        const m = new Map(map); m.set(a.id, groups); return m;
      }),
      error: () => this.assignmentGroups.update(map => {
        const m = new Map(map); m.set(a.id, []); return m;
      }),
    });
  }

  groupsFor(a: AssignmentResponse): AssignmentGroup[] {
    return this.assignmentGroups().get(a.id) ?? [];
  }

  removeGroup(a: AssignmentResponse, g: AssignmentGroup) {
    if (!confirm(this.translate.instant('confirm_remove_group', { name: g.name }))) return;

    this.loading.show();
    this.groupService.deleteGroup(g.id).subscribe({
      next: () => {
        this.assignmentGroups.update(map => {
          const m = new Map(map);
          m.set(a.id, (m.get(a.id) ?? []).filter(x => x.id !== g.id));
          return m;
        });
        this.loading.hide();
      },
      error: () => this.loading.hide(),
    });
  }

  // ── Styles ─────────────────────────────────────────────────
  readonly pageStyle     = { display: 'flex', flexDirection: 'column' as const, gap: '0' };
  readonly overlineStyle = { fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: DS.colors.cyan, marginBottom: '6px' };
  readonly h1Style       = { fontFamily: DS.fonts.display, fontSize: '1.75rem', fontWeight: '700', letterSpacing: '-0.03em', color: DS.colors.fg1 };
  readonly overlayStyle  = { position: 'fixed', inset: '0', background: 'oklch(0% 0 0 / 0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: '100' };
  readonly modalStyle    = { background: DS.colors.surface, border: `1px solid ${DS.colors.border}`, borderRadius: '16px', padding: '28px', width: '440px', display: 'flex', flexDirection: 'column' as const, gap: '16px', boxShadow: '0 8px 32px oklch(0% 0 0 / 0.8)' };
  readonly emptyStyle    = { textAlign: 'center' as const, padding: '48px', color: DS.colors.fg3, fontSize: '0.9rem' };
  readonly errorStyle    = { fontSize: '0.8125rem', color: DS.colors.red, background: DS.colors.redSubtle, border: `1px solid ${DS.colors.redBorder}`, borderRadius: DS.radius.md, padding: `${DS.space[2]} ${DS.space[3]}` };
  readonly crumbStyle    = { fontSize: '0.8125rem', color: DS.colors.violet, cursor: 'pointer', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px' };
  readonly inputStyle    = { width: '100%', boxSizing: 'border-box' as const, padding: '9px 12px', background: DS.colors.bg, border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.md, color: DS.colors.fg1, fontFamily: DS.fonts.body, fontSize: '0.875rem', outline: 'none' };
  readonly textAreaStyle = { ...this.inputStyle, minHeight: '80px', resize: 'vertical' as const, fontFamily: DS.fonts.body };
  readonly fieldLabelStyle = { fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: DS.colors.fg3, marginBottom: '4px', display: 'block' };
}