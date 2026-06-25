import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { NgStyle } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DS } from '../../tokens';
import { BtnComponent } from '../../shared/btn.component';
import { ContainerComponent, ContainerConfig } from '../../shared/container.component';
import { TabListComponent, TabDirective } from '../../shared/tabs.component';
import { AuthService } from '../../services/auth.service';
import { CourseService } from '../../core/services/course-service/course-service';
import { AssignmentService, AssignmentResponse } from '../../core/services/course-service/Assignment.service';
import { EvalService, EvalSectionType } from '../../core/services/eval-service/eval-service';
import { LoadingService } from '../../core/services/loading-service/loading.service';

interface PendingSection {
  id?: number;
  name: string;
  description: string;
  marks: number;
  sectionType: EvalSectionType;
}

@Component({
  selector: 'app-assignment-create',
  standalone: true,
  imports: [NgStyle, BtnComponent, ContainerComponent, TabListComponent, TabDirective, TranslateModule],
  templateUrl: './assignment-create.component.html',
})
export class AssignmentCreateComponent implements OnInit {
  private route        = inject(ActivatedRoute);
  private router       = inject(Router);
  private auth          = inject(AuthService);
  private courseService = inject(CourseService);
  private assignService = inject(AssignmentService);
  private evalService    = inject(EvalService);
  private loading       = inject(LoadingService);
  private translate     = inject(TranslateService);

  className = signal<string | null>(null);
  error     = signal<string | null>(null);
  activeTab = signal(0);

  // ── Edit mode (editing an existing assignment + its eval sheet) ──
  editMode = signal(false);

  // ── Assignment fields ───────────────────────────────────────
  name          = signal('');
  description   = signal('');
  maxScore      = signal<number | null>(null);
  reqEval       = signal<number | null>(null);
  groupSize     = signal<number | null>(null);
  passThreshold = signal<number | null>(null);
  fileName      = signal<string | null>(null);
  private file: File | null = null;

  // ── Eval sheet sections (built locally, persisted on save) ──
  pendingSections = signal<PendingSection[]>([]);
  /** Section ids that existed on the backend when editing started — diffed against pendingSections on save to know what to delete. */
  private originalSectionIds = new Set<number>();
  sectionName   = signal('');
  sectionDesc   = signal('');
  sectionMarks  = signal<number | null>(null);
  sectionType   = signal<EvalSectionType>('Toggle');

  // ── Section preview (expand-to-show-description) + edit state ──
  expandedIndex = signal<number | null>(null);
  editingIndex  = signal<number | null>(null);
  editName   = signal('');
  editDesc   = signal('');
  editMarks  = signal<number | null>(null);
  editType   = signal<EvalSectionType>('Toggle');

  totalMarks     = computed(() => this.pendingSections().reduce((sum, s) => sum + s.marks, 0));
  remainingMarks = computed(() => (this.maxScore() ?? 0) - this.totalMarks());
  /** Marks available for the section currently being edited (its own current marks don't count against itself). */
  editRemainingMarks = computed(() => {
    const idx = this.editingIndex();
    const current = idx !== null ? this.pendingSections()[idx] : undefined;
    return this.remainingMarks() + (current?.marks ?? 0);
  });
  scoreColor     = computed(() => {
    const max = this.maxScore();
    if (!max) return DS.colors.fg2;
    return this.totalMarks() === max ? DS.colors.green : DS.colors.amber;
  });

  private classId: number | null = null;
  private assignmentId: number | null = null;
  private sheetId: number | null = null;

  readonly flatConfig: ContainerConfig = { variant: 'flat', height: 'auto', scrollable: false };

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const assId = parseInt(params['assId'], 10);
      if (assId) {
        this.editMode.set(true);
        this.assignmentId = assId;
        this.loadForEdit(assId);
        return;
      }

      const id = parseInt(params['classId'], 10);
      if (!id) { this.error.set(this.translate.instant('error_missing_class_id')); return; }
      this.classId = id;
      this.courseService.getClass(id).subscribe({
        next: (cls) => this.className.set(cls.name),
        error: () => this.className.set(null),
      });
    });
  }

  private loadForEdit(assId: number) {
    this.loading.show();
    this.assignService.getAssignmentById(assId).subscribe({
      next: (a) => {
        this.classId = a.classid;
        this.name.set(a.name);
        this.description.set(a.description);
        this.maxScore.set(a.max_score);
        this.reqEval.set(a.req_eval);
        this.groupSize.set(a.groupSize ?? 1);
        this.passThreshold.set(a.pass_threshold ?? 80);
        this.fileName.set(a.file?.name ?? null);

        this.courseService.getClass(a.classid).subscribe({
          next: (cls) => this.className.set(cls.name),
          error: () => this.className.set(null),
        });

        this.evalService.getEvalSheetByAssignment(assId).subscribe({
          next: (sheet) => {
            this.sheetId = sheet.id;
            const sections = sheet.sections.map(s => ({
              id: s.id, name: s.name, description: s.description, marks: s.marks, sectionType: s.sectionType,
            }));
            this.pendingSections.set(sections);
            this.originalSectionIds = new Set(sections.map(s => s.id));
            this.loading.hide();
          },
          // No eval sheet yet — one will be created on save.
          error: () => this.loading.hide(),
        });
      },
      error: () => {
        this.error.set(this.translate.instant('error_assignment_not_found'));
        this.loading.hide();
      },
    });
  }

  onFilePicked(event: Event) {
    const f = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.file = f;
    this.fileName.set(f?.name ?? null);
  }

  // ── Sections ─────────────────────────────────────────────────
  addSection() {
    const maxScore = this.maxScore();
    const name  = this.sectionName().trim();
    const desc  = this.sectionDesc().trim();
    const marks = this.sectionMarks();

    if (!maxScore || maxScore <= 0) { this.error.set(this.translate.instant('error_set_valid_max_score_first')); return; }
    if (!name)  { this.error.set(this.translate.instant('error_section_name_required')); return; }
    if (!desc)  { this.error.set(this.translate.instant('error_section_description_required')); return; }
    if (!marks || marks <= 0) { this.error.set(this.translate.instant('error_invalid_marks')); return; }
    if (marks > this.remainingMarks()) {
      this.error.set(this.translate.instant('error_section_exceeds_max', { total: this.totalMarks() + marks, max: maxScore, remaining: this.remainingMarks() }));
      return;
    }

    this.error.set(null);
    this.pendingSections.update(list => [...list, { name, description: desc, marks, sectionType: this.sectionType() }]);
    this.sectionName.set('');
    this.sectionDesc.set('');
    this.sectionMarks.set(null);
    this.sectionType.set('Toggle');
  }

  removeSection(index: number) {
    this.pendingSections.update(list => list.filter((_, i) => i !== index));
    this.expandedIndex.set(null);
    this.editingIndex.set(null);
  }

  // ── Preview expand + edit ───────────────────────────────────
  toggleExpand(index: number) {
    this.expandedIndex.update(cur => cur === index ? null : index);
  }

  startEdit(index: number) {
    const s = this.pendingSections()[index];
    if (!s) return;
    this.editingIndex.set(index);
    this.editName.set(s.name);
    this.editDesc.set(s.description);
    this.editMarks.set(s.marks);
    this.editType.set(s.sectionType);
    this.expandedIndex.set(index);
    this.error.set(null);
  }

  cancelEdit() {
    this.editingIndex.set(null);
  }

  saveEdit() {
    const idx  = this.editingIndex();
    const name = this.editName().trim();
    const desc = this.editDesc().trim();
    const marks = this.editMarks();

    if (idx === null) return;
    if (!name) { this.error.set(this.translate.instant('error_section_name_required')); return; }
    if (!desc) { this.error.set(this.translate.instant('error_section_description_required')); return; }
    if (!marks || marks <= 0) { this.error.set(this.translate.instant('error_invalid_marks')); return; }
    if (marks > this.editRemainingMarks()) {
      this.error.set(this.translate.instant('error_section_exceeds_max_edit', { max: this.maxScore() ?? 0, available: this.editRemainingMarks() }));
      return;
    }

    this.error.set(null);
    this.pendingSections.update(list => list.map((s, i) =>
      i === idx ? { ...s, name, description: desc, marks, sectionType: this.editType() } : s
    ));
    this.editingIndex.set(null);
  }

  // ── Save ──────────────────────────────────────────────────────
  onSave() {
    if (this.editMode()) { this.onUpdate(); return; }

    const classId   = this.classId;
    const name      = this.name().trim();
    const desc      = this.description().trim();
    const maxScore  = this.maxScore();
    const reqEval   = this.reqEval();
    const createdBy = this.auth.user()?.id;

    if (!classId)                          { this.error.set(this.translate.instant('error_missing_class_id')); return; }
    if (!createdBy)                        { this.error.set(this.translate.instant('error_user_not_identified')); return; }
    if (!name)                             { this.error.set(this.translate.instant('error_name_required')); return; }
    if (!desc)                             { this.error.set(this.translate.instant('error_description_required')); return; }
    if (!maxScore || maxScore <= 0)        { this.error.set(this.translate.instant('error_invalid_max_score')); return; }
    if (!reqEval  || reqEval  <= 0)        { this.error.set(this.translate.instant('error_invalid_req_eval')); return; }
    if (this.pendingSections().length === 0) {
      this.activeTab.set(1);
      this.error.set(this.translate.instant('error_eval_sheet_required'));
      return;
    }
    if (this.totalMarks() !== maxScore) {
      this.activeTab.set(1);
      this.error.set(this.translate.instant('error_eval_sheet_total_mismatch', { total: this.totalMarks(), max: maxScore }));
      return;
    }

    this.error.set(null);
    this.loading.show();
    this.assignService.createAssignment(classId, {
      name, description: desc, maxScore, reqEval, createdBy,
      file: this.file ?? undefined,
    }).subscribe({
      next: (assignment) => this.createEvalSheet(assignment, classId),
      error: (err) => {
        this.error.set(err?.error?.message ?? this.translate.instant('error_create_assignment_failed'));
        this.loading.hide();
      },
    });
  }

  /** The eval sheet (and any sections defined on the Eval sheet tab) is created right after the assignment, as part of the same flow. */
  private createEvalSheet(assignment: AssignmentResponse, classId: number) {
    this.evalService.createEvalSheet(assignment.id).subscribe({
      next: (sheet) => {
        const sections = this.pendingSections();
        if (sections.length === 0) {
          this.loading.hide();
          this.router.navigate(['/bocal/classes'], { queryParams: { classId } });
          return;
        }
        forkJoin(sections.map(s => this.evalService.createSection(sheet.id, s))).subscribe({
          next: () => {
            this.loading.hide();
            this.router.navigate(['/bocal/classes'], { queryParams: { classId } });
          },
          // The assignment and sheet already exist; let the user finish adding sections from this same page in edit mode.
          error: () => {
            this.loading.hide();
            this.router.navigate(['/bocal/assignment-create'], { queryParams: { assId: assignment.id } });
          },
        });
      },
      error: () => {
        this.loading.hide();
        this.router.navigate(['/bocal/assignment-create'], { queryParams: { assId: assignment.id } });
      },
    });
  }

  /** Updates the assignment fields, then syncs the eval sheet sections (create/update/delete) to match pendingSections. */
  private onUpdate() {
    const assId          = this.assignmentId;
    const classId         = this.classId;
    const name            = this.name().trim();
    const desc            = this.description().trim();
    const maxScore        = this.maxScore();
    const reqEval         = this.reqEval();
    const groupSize       = this.groupSize();
    const passThreshold   = this.passThreshold();
    const createdBy       = this.auth.user()?.id;

    if (!assId || !classId)                { this.error.set(this.translate.instant('error_missing_assignment')); return; }
    if (!createdBy)                        { this.error.set(this.translate.instant('error_user_not_identified')); return; }
    if (!name)                             { this.error.set(this.translate.instant('error_name_required')); return; }
    if (!desc)                             { this.error.set(this.translate.instant('error_description_required')); return; }
    if (!maxScore || maxScore <= 0)        { this.error.set(this.translate.instant('error_invalid_max_score')); return; }
    if (!reqEval  || reqEval  <= 0)        { this.error.set(this.translate.instant('error_invalid_req_eval')); return; }
    if (!groupSize || groupSize <= 0)      { this.error.set(this.translate.instant('error_invalid_group_size')); return; }
    if (!passThreshold || passThreshold <= 0) { this.error.set(this.translate.instant('error_invalid_pass_threshold')); return; }
    if (this.pendingSections().length === 0) {
      this.activeTab.set(1);
      this.error.set(this.translate.instant('error_eval_sheet_required'));
      return;
    }
    if (this.totalMarks() !== maxScore) {
      this.activeTab.set(1);
      this.error.set(this.translate.instant('error_eval_sheet_total_mismatch', { total: this.totalMarks(), max: maxScore }));
      return;
    }

    this.error.set(null);
    this.loading.show();
    this.assignService.updateAssignment(assId, {
      classId, name, description: desc, groupSize, reqEval, maxScore, passThreshold,
      createdBy, file: this.file ?? undefined,
    }).subscribe({
      next: () => this.syncEvalSheet(assId, classId),
      error: (err) => {
        this.error.set(err?.error?.message ?? this.translate.instant('error_update_assignment_failed'));
        this.loading.hide();
      },
    });
  }

  /** Brings the backend eval sheet in line with pendingSections: creates new sections, updates existing ones, deletes removed ones. */
  private syncEvalSheet(assId: number, classId: number) {
    if (this.sheetId) {
      this.applySectionChanges(this.sheetId, classId);
      return;
    }
    this.evalService.createEvalSheet(assId).subscribe({
      next: (sheet) => { this.sheetId = sheet.id; this.applySectionChanges(sheet.id, classId); },
      error: () => {
        this.loading.hide();
        this.router.navigate(['/bocal/classes'], { queryParams: { classId } });
      },
    });
  }

  private applySectionChanges(sheetId: number, classId: number) {
    const finish = () => {
      this.loading.hide();
      this.router.navigate(['/bocal/classes'], { queryParams: { classId } });
    };

    const current = this.pendingSections();
    const currentIds = new Set(current.filter(s => s.id != null).map(s => s.id!));
    const removedIds = [...this.originalSectionIds].filter(id => !currentIds.has(id));

    const ops = [
      ...removedIds.map(id => this.evalService.removeSection(sheetId, id)),
      ...current.filter(s => s.id == null).map(s => this.evalService.createSection(sheetId, s)),
      ...current.filter(s => s.id != null).map(s => this.evalService.updateSection(sheetId, {
        secId: s.id!, name: s.name, description: s.description, marks: s.marks, sectionType: s.sectionType,
      })),
    ];

    if (ops.length === 0) { finish(); return; }
    forkJoin(ops).subscribe({ next: finish, error: finish });
  }

  onCancel() {
    if (this.classId) this.router.navigate(['/bocal/classes'], { queryParams: { classId: this.classId } });
    else this.router.navigate(['/bocal/classes']);
  }

  // ── Styles ─────────────────────────────────────────────────
  readonly pageStyle     = { display: 'flex', flexDirection: 'column' as const, gap: '16px', maxWidth: '620px' };
  readonly crumbStyle    = { fontSize: '0.8125rem', color: DS.colors.violet, cursor: 'pointer', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' };
  readonly overlineStyle = { fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: DS.colors.cyan, marginBottom: '6px' };
  readonly h1Style       = { fontFamily: DS.fonts.display, fontSize: '1.75rem', fontWeight: '700', letterSpacing: '-0.03em', color: DS.colors.fg1 };
  readonly subStyle      = { fontSize: '0.9375rem', color: DS.colors.fg2 };
  readonly errorStyle    = { fontSize: '0.8125rem', color: DS.colors.red, background: DS.colors.redSubtle, border: `1px solid ${DS.colors.redBorder}`, borderRadius: DS.radius.md, padding: `${DS.space[2]} ${DS.space[3]}` };
  readonly fieldLabelStyle = { fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: DS.colors.fg3, marginBottom: '4px', display: 'block' };
  readonly inputStyle    = { width: '100%', boxSizing: 'border-box' as const, padding: '9px 12px', background: DS.colors.bg, border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.md, color: DS.colors.fg1, fontFamily: DS.fonts.body, fontSize: '0.875rem', outline: 'none' };
  readonly textAreaStyle = { ...this.inputStyle, minHeight: '80px', resize: 'vertical' as const };
  readonly emptyStyle    = { textAlign: 'center' as const, padding: '32px', color: DS.colors.fg3, fontSize: '0.875rem' };
}
