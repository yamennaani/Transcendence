import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { NgStyle } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DS } from '../../tokens';
import { BtnComponent } from '../../shared/btn.component';
import { ContainerComponent, ContainerConfig } from '../../shared/container.component';
import { EvalService, EvalSheet, EvalSectionType } from '../../core/services/eval-service/eval-service';
import { AssignmentService, AssignmentResponse } from '../../core/services/course-service/Assignment.service';
import { LoadingService } from '../../core/services/loading-service/loading.service';

@Component({
  selector: 'app-eval-sheet',
  standalone: true,
  imports: [NgStyle, BtnComponent, ContainerComponent],
  templateUrl: './eval-sheet.component.html',
})
export class EvalSheetComponent implements OnInit {
  private route        = inject(ActivatedRoute);
  private router       = inject(Router);
  private evalService  = inject(EvalService);
  private assignService = inject(AssignmentService);
  private loading      = inject(LoadingService);

  assignment = signal<AssignmentResponse | null>(null);
  sheet      = signal<EvalSheet | null>(null);
  error      = signal<string | null>(null);

  // ── Add-section form state ──────────────────────────────────
  sectionName = signal('');
  sectionDesc = signal('');
  sectionMarks = signal<number | null>(null);
  sectionType  = signal<EvalSectionType>('Toggle');

  // ── Section preview (expand-to-show-description) + edit state ──
  expandedSectionId = signal<number | null>(null);
  editingSectionId  = signal<number | null>(null);
  editName   = signal('');
  editDesc   = signal('');
  editMarks  = signal<number | null>(null);
  editType   = signal<EvalSectionType>('Toggle');

  sections       = computed(() => this.sheet()?.sections ?? []);
  totalMarks     = computed(() => this.sections().reduce((sum, s) => sum + s.marks, 0));
  maxScore       = computed(() => this.assignment()?.max_score ?? 0);
  remainingMarks = computed(() => this.maxScore() - this.totalMarks());
  /** Marks available for the section currently being edited (its own current marks don't count against itself). */
  editRemainingMarks = computed(() => {
    const editing = this.sections().find(s => s.id === this.editingSectionId());
    return this.remainingMarks() + (editing?.marks ?? 0);
  });
  totalColor = computed(() => {
    const total = this.totalMarks(), max = this.maxScore();
    if (max === 0) return DS.colors.fg2;
    return total === max ? DS.colors.green : DS.colors.amber;
  });

  private assId: number | null = null;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const id = parseInt(params['assId'], 10);
      if (!id) { this.error.set('Missing assignment id.'); return; }
      this.assId = id;
      this.load(id);
    });
  }

  private load(assId: number) {
    this.error.set(null);
    this.loading.show();
    this.assignService.getAssignmentById(assId).subscribe({
      next: (ass) => {
        this.assignment.set(ass);
        this.evalService.getEvalSheetByAssignment(assId).subscribe({
          next: (sheet) => { this.sheet.set(sheet); this.loading.hide(); },
          error: (err) => {
            if (err.status !== 404) this.error.set('Failed to load eval sheet.');
            this.sheet.set(null);
            this.loading.hide();
          },
        });
      },
      error: () => {
        this.error.set('Assignment not found.');
        this.loading.hide();
      },
    });
  }

  createSheet() {
    if (!this.assId) return;
    this.error.set(null);
    this.loading.show();
    this.evalService.createEvalSheet(this.assId).subscribe({
      next: (sheet) => { this.sheet.set({ ...sheet, sections: [] }); this.loading.hide(); },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to create eval sheet.');
        this.loading.hide();
      },
    });
  }

  addSection() {
    const sheet = this.sheet();
    const name   = this.sectionName().trim();
    const desc   = this.sectionDesc().trim();
    const marks  = this.sectionMarks();

    if (!sheet) return;
    if (!name)  { this.error.set('Section name is required.'); return; }
    if (!desc)  { this.error.set('Section description is required.'); return; }
    if (!marks || marks <= 0) { this.error.set('Enter a valid number of marks.'); return; }
    if (marks > this.remainingMarks()) {
      this.error.set(`That section would push the total to ${this.totalMarks() + marks}, above the assignment's max score of ${this.maxScore()} (${this.remainingMarks()} remaining).`);
      return;
    }

    this.error.set(null);
    this.loading.show();
    this.evalService.createSection(sheet.id, {
      name, description: desc, marks, sectionType: this.sectionType(),
    }).subscribe({
      next: (section) => {
        this.sheet.update(s => s ? { ...s, sections: [...s.sections, section] } : s);
        this.sectionName.set('');
        this.sectionDesc.set('');
        this.sectionMarks.set(null);
        this.sectionType.set('Toggle');
        this.loading.hide();
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to add section.');
        this.loading.hide();
      },
    });
  }

  removeSection(sectionId: number) {
    const sheet = this.sheet();
    if (!sheet) return;
    if (!confirm('Remove this section?')) return;

    this.loading.show();
    this.evalService.removeSection(sheet.id, sectionId).subscribe({
      next: () => {
        this.sheet.update(s => s ? { ...s, sections: s.sections.filter(sec => sec.id !== sectionId) } : s);
        if (this.expandedSectionId() === sectionId) this.expandedSectionId.set(null);
        if (this.editingSectionId() === sectionId) this.editingSectionId.set(null);
        this.loading.hide();
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to remove section.');
        this.loading.hide();
      },
    });
  }

  // ── Preview expand + edit ───────────────────────────────────
  toggleExpand(sectionId: number) {
    this.expandedSectionId.update(cur => cur === sectionId ? null : sectionId);
  }

  startEdit(s: { id: number; name: string; description: string; marks: number; sectionType: EvalSectionType }) {
    this.editingSectionId.set(s.id);
    this.editName.set(s.name);
    this.editDesc.set(s.description);
    this.editMarks.set(s.marks);
    this.editType.set(s.sectionType);
    this.expandedSectionId.set(s.id);
    this.error.set(null);
  }

  cancelEdit() {
    this.editingSectionId.set(null);
  }

  saveEdit() {
    const sheet = this.sheet();
    const secId = this.editingSectionId();
    const name        = this.editName().trim();
    const description = this.editDesc().trim();
    const marks       = this.editMarks();
    const sectionType = this.editType();

    if (!sheet || secId == null) return;
    if (!name)        { this.error.set('Section name is required.'); return; }
    if (!description) { this.error.set('Section description is required.'); return; }
    if (!marks || marks <= 0) { this.error.set('Enter a valid number of marks.'); return; }
    if (marks > this.editRemainingMarks()) {
      this.error.set(`That would push the total above the assignment's max score of ${this.maxScore()} (${this.editRemainingMarks()} available for this section).`);
      return;
    }

    this.error.set(null);
    this.loading.show();
    this.evalService.updateSection(sheet.id, { secId, name, description, marks, sectionType }).subscribe({
      next: (updated) => {
        this.sheet.update(s => s ? { ...s, sections: s.sections.map(sec => sec.id === secId ? updated : sec) } : s);
        this.editingSectionId.set(null);
        this.loading.hide();
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to update section.');
        this.loading.hide();
      },
    });
  }

  back() {
    const cls = this.assignment()?.classid;
    this.router.navigate(['/bocal/classes'], { queryParams: cls ? { classId: cls } : {} });
  }

  // ── Styles ─────────────────────────────────────────────────
  readonly pageStyle     = { display: 'flex', flexDirection: 'column' as const, gap: '16px', maxWidth: '720px' };
  readonly crumbStyle    = { fontSize: '0.8125rem', color: DS.colors.violet, cursor: 'pointer', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' };
  readonly overlineStyle = { fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: DS.colors.cyan, marginBottom: '6px' };
  readonly h1Style       = { fontFamily: DS.fonts.display, fontSize: '1.75rem', fontWeight: '700', letterSpacing: '-0.03em', color: DS.colors.fg1 };
  readonly subStyle      = { fontSize: '0.9375rem', color: DS.colors.fg2 };
  readonly emptyStyle    = { textAlign: 'center' as const, padding: '48px', color: DS.colors.fg3, fontSize: '0.9rem' };
  readonly errorStyle    = { fontSize: '0.8125rem', color: DS.colors.red, background: DS.colors.redSubtle, border: `1px solid ${DS.colors.redBorder}`, borderRadius: DS.radius.md, padding: `${DS.space[2]} ${DS.space[3]}` };
  readonly fieldLabelStyle = { fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: DS.colors.fg3, marginBottom: '4px', display: 'block' };
  readonly inputStyle    = { width: '100%', boxSizing: 'border-box' as const, padding: '9px 12px', background: DS.colors.bg, border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.md, color: DS.colors.fg1, fontFamily: DS.fonts.body, fontSize: '0.875rem', outline: 'none' };
  readonly textAreaStyle = { ...this.inputStyle, minHeight: '70px', resize: 'vertical' as const };

  readonly flatConfig: ContainerConfig  = { variant: 'flat',  height: 'auto', scrollable: false };
  readonly insetConfig: ContainerConfig = { variant: 'inset', height: 'auto', scrollable: false };
}
