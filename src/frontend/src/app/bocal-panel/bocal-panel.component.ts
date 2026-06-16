import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { NgStyle, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { DS } from '../tokens';
import { BtnComponent } from '../shared/btn.component';
import { ListComponent } from '../shared/list.component';
import { FieldComponent } from '../shared/field.component';
import { ContainerComponent, ContainerConfig } from '../shared/container.component';
import { CreateClassPage } from '../shared/CreateClassPage';
import { FieldType, SelectField } from '../shared/field.types';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../services/auth.service';
import { CourseService } from '../core/services/course-service/course-service';
import { AssignmentService, AssignmentResponse } from '../core/services/course-service/Assignment.service';
import { OrgService } from '../core/services/org-service/org-service';
import { LoadingService } from '../core/services/loading-service/loading.service';
import { TabListComponent, TabDirective } from '../shared/tabs.component';
import { AvatarComponent } from '../shared/avatar.component';

interface BocalClass {
  id: number;
  name: string;
  description: string;
  created_at: string;
  org_id: number;
  assignmentCount: number;
}

export interface OrgMember {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
}

const ANALYTICS_KEYS = [
  { labelKey: 'analytics_completion_rate',    valueKey: '—',        subKey: 'analytics_completion_sub',    color: DS.colors.violet },
  { labelKey: 'analytics_avg_evals',          valueKey: '—',        subKey: 'analytics_avg_evals_sub',      color: DS.colors.cyan   },
  { labelKey: 'analytics_pass_rate',          valueKey: '—',        subKey: 'analytics_pass_rate_sub',      color: DS.colors.green  },
  { labelKey: 'analytics_pending_evals',      valueKey: '—',        subKey: 'analytics_pending_evals_sub',  color: DS.colors.amber  },
];

@Component({
  selector: 'app-bocal-panel',
  standalone: true,
  imports: [
    NgStyle, DatePipe, TranslateModule,
    TabListComponent, TabDirective,
    AvatarComponent, BtnComponent, FieldComponent, ContainerComponent, ListComponent,
    CreateClassPage,
  ],
  templateUrl: './bocal-panel.component.html',
})
export class BocalPanelComponent implements OnInit {
  private auth          = inject(AuthService);
  private courseService = inject(CourseService);
  private assignService = inject(AssignmentService);
  private orgService    = inject(OrgService);
  private loading       = inject(LoadingService);
  private translate     = inject(TranslateService);
  router = inject(Router);

  activeTab = signal(0);
  onTabChanged(index: number) { this.activeTab.set(index); }

  // ── Modal visibility ───────────────────────────────────────
  showNew        = signal(false);
  showAddMember  = signal(false);
  showAddAssign  = signal(false);

  // ── Data signals ───────────────────────────────────────────
  classes          = signal<BocalClass[]>([]);
  members          = signal<OrgMember[]>([]);
  selectedClass    = signal<BocalClass | null>(null);
  classAssignments = signal<AssignmentResponse[]>([]);
  analytics        = signal<any[]>([]);

  students = computed(() => this.members().filter(m => m.role === 'Student'));

  readonly memberTrackFn = (m: OrgMember) => m.id;

  // ── Form error signals ─────────────────────────────────────
  memberError     = signal<string | null>(null);
  assignmentError = signal<string | null>(null);

  // ── Form field changes ─────────────────────────────────────
  private memberChanges     = new Map<string, FieldType>();
  private assignmentChanges = new Map<string, FieldType>();

  // ── Add member fields ──────────────────────────────────────
  readonly memberFields: FieldType[] = [
    { type: 'text',   label: 'Email',    icon: 'email',  required: true, allowEdit: true, value: undefined },
    { type: 'text',   label: 'Username', icon: 'person', required: true, allowEdit: true, value: undefined },
    { type: 'select', label: 'Role', icon: 'badge', required: true, allowEdit: true, value: 'Student', options: ['Student', 'Bocal', 'Admin'] } as SelectField,
  ];

  // ── Add assignment fields ──────────────────────────────────
  readonly assignmentFields: FieldType[] = [
    { type: 'text',      label: 'Name',           icon: 'title',       required: true, allowEdit: true, value: undefined },
    { type: 'text-area', label: 'Description',    icon: 'description', required: true, allowEdit: true, value: undefined },
    { type: 'text',      label: 'Max Score',      icon: 'score',       required: true, allowEdit: true, value: undefined },
    { type: 'text',      label: 'Required Evals', icon: 'rate_review', required: true, allowEdit: true, value: undefined },
  ];

  // ── Container configs ──────────────────────────────────────
  readonly flatConfig: ContainerConfig   = { variant: 'flat',  height: 'auto', scrollable: false };
  readonly raisedConfig: ContainerConfig = { variant: 'card',  height: 'auto', scrollable: false };
  readonly insetConfig: ContainerConfig  = { variant: 'inset', height: 'auto', scrollable: false };

  private get orgId() { return this.auth.user()?.orgId; }

  ngOnInit() { 
    this.buildAnalytics();
    this.translate.onLangChange.subscribe(() => {
      this.buildAnalytics();
    });
    this.loadAll(); 
  }

  private buildAnalytics() {
    const translated = ANALYTICS_KEYS.map(a => ({
      label: this.translate.instant(a.labelKey),
      value: a.valueKey,
      sub: this.translate.instant(a.subKey),
      color: a.color,
    }));
    this.analytics.set(translated);
  }

  loadAll() {
    const orgId = this.orgId;
    if (!orgId) return;

    this.loading.show();
    forkJoin({
      courses: this.courseService.getClassByOrgId(orgId),
      members: this.orgService.listOrgMembers(orgId),
    }).subscribe({
      next: ({ courses, members }) => {
        this.members.set(members as OrgMember[]);

        if (courses.length === 0) {
          this.classes.set([]);
          this.loading.hide();
          return;
        }

        forkJoin(courses.map(c => this.assignService.getAssignments(c.id))).subscribe({
          next: (allAssignments) => {
            this.classes.set(courses.map((c, i) => ({
              id: c.id, name: c.name, description: c.description,
              created_at: c.created_at, org_id: c.org_id,
              assignmentCount: (allAssignments[i] as any[]).length,
            })));
            this.loading.hide();
          },
          error: () => {
            this.classes.set(courses.map(c => ({ ...c, assignmentCount: 0 })));
            this.loading.hide();
          },
        });
      },
      error: () => this.loading.hide(),
    });
  }

  // ── Class selection ────────────────────────────────────────
  selectClass(c: BocalClass) {
    this.selectedClass.set(c);
    this.loading.show();
    this.assignService.getAssignments(c.id).subscribe({
      next: (list) => { this.classAssignments.set(list); this.loading.hide(); },
      error: ()     =>   this.loading.hide(),
    });
  }

  // ── Create class ───────────────────────────────────────────
  onClassCreated() {
    this.showNew.set(false);
    this.loadAll();
  }

  // ── Add member ─────────────────────────────────────────────
  onMemberFieldChanged(f: FieldType) { this.memberChanges.set(f.label, f); }

  private getMemberValue(label: string): any {
    const c = this.memberChanges.get(label);
    return c !== undefined ? c.value : this.memberFields.find(f => f.label === label)?.value;
  }

  onAddMember() {
    const orgId    = this.orgId;
    const email    = (this.getMemberValue('Email') as string)?.trim();
    const username = (this.getMemberValue('Username') as string)?.trim();
    const role     = (this.getMemberValue('Role') as string) ?? 'Student';

    if (!email)    { this.memberError.set(this.translate.instant('error_email_required'));    return; }
    if (!username) { this.memberError.set(this.translate.instant('error_username_required')); return; }
    if (!orgId)    { this.memberError.set(this.translate.instant('error_no_organization')); return; }

    this.memberError.set(null);
    this.loading.show();
    this.orgService.addMember(orgId, { email, username, role }).subscribe({
      next: () => {
        this.loading.hide();
        this.showAddMember.set(false);
        this.memberChanges.clear();
        this.loadAll();
      },
      error: (err) => {
        this.memberError.set(err?.error?.message ?? this.translate.instant('error_add_member_failed'));
        this.loading.hide();
      },
    });
  }

  closeMemberModal() {
    this.showAddMember.set(false);
    this.memberChanges.clear();
    this.memberError.set(null);
  }

  // ── Add assignment ─────────────────────────────────────────
  onAssignmentFieldChanged(f: FieldType) { this.assignmentChanges.set(f.label, f); }

  private getAssignValue(label: string): any {
    const c = this.assignmentChanges.get(label);
    return c !== undefined ? c.value : this.assignmentFields.find(f => f.label === label)?.value;
  }

  onAddAssignment() {
    const cls      = this.selectedClass();
    const name     = (this.getAssignValue('Name') as string)?.trim();
    const desc     = (this.getAssignValue('Description') as string)?.trim();
    const maxScore = parseInt(this.getAssignValue('Max Score'), 10);
    const reqEval  = parseInt(this.getAssignValue('Required Evals'), 10);

    if (!cls)                          { return; }
    if (!name)                         { this.assignmentError.set(this.translate.instant('error_name_required')); return; }
    if (!desc)                         { this.assignmentError.set(this.translate.instant('error_description_required')); return; }
    if (isNaN(maxScore) || maxScore <= 0) { this.assignmentError.set(this.translate.instant('error_invalid_max_score')); return; }
    if (isNaN(reqEval)  || reqEval  <= 0) { this.assignmentError.set(this.translate.instant('error_invalid_required_evals')); return; }

    this.assignmentError.set(null);
    this.loading.show();
    const createdBy = this.auth.user()?.id ?? 0;
    this.assignService.createAssignment(cls.id, { name, description: desc, maxScore, reqEval, createdBy }).subscribe({
      next: (a) => {
        this.classAssignments.update(list => [...list, a]);
        this.classes.update(list => list.map(c =>
          c.id === cls.id ? { ...c, assignmentCount: c.assignmentCount + 1 } : c
        ));
        this.closeAssignModal();
        this.loading.hide();
      },
      error: (err) => {
        this.assignmentError.set(err?.error?.message ?? this.translate.instant('error_create_assignment_failed'));
        this.loading.hide();
      },
    });
  }

  closeAssignModal() {
    this.showAddAssign.set(false);
    this.assignmentChanges.clear();
    this.assignmentError.set(null);
  }

  // ── Role badge style ───────────────────────────────────────
  roleStyle(role: string) {
    const map: Record<string, { bg: string; color: string; border: string }> = {
      Student: { bg: DS.colors.cyanSubtle,   color: DS.colors.cyan,   border: DS.colors.cyanBorder   },
      Bocal:   { bg: DS.colors.violetSubtle, color: DS.colors.violet, border: DS.colors.violetBorder },
      Admin:   { bg: DS.colors.amberSubtle,  color: DS.colors.amber,  border: DS.colors.amberBorder  },
    };
    const s = map[role] ?? { bg: DS.colors.surfaceRaised, color: DS.colors.fg3, border: DS.colors.border };
    return {
      fontSize: '0.6875rem', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase',
      padding: '2px 8px', borderRadius: '9999px',
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    };
  }

  // ── Styles ─────────────────────────────────────────────────
  readonly pageStyle     = { flex: '1', overflowY: 'auto', padding: '32px' };
  readonly overlineStyle = { fontSize: '0.6875rem', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: DS.colors.violet, marginBottom: '4px' };
  readonly h1Style       = { fontFamily: DS.fonts.display, fontSize: '2rem', fontWeight: '700', letterSpacing: '-0.03em', color: DS.colors.fg1, margin: '0' };
  readonly crumbStyle    = { color: DS.colors.violet, cursor: 'pointer', fontSize: '1rem', fontWeight: '400', marginRight: '8px' };
  readonly overlayStyle  = { position: 'fixed' as const, inset: '0', background: 'oklch(0% 0 0 / 60%)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: '100', backdropFilter: 'blur(4px)' };
  readonly modalStyle    = { background: DS.colors.surface, border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.lg, padding: '24px', display: 'flex', flexDirection: 'column' as const, gap: '16px', minWidth: '360px', maxWidth: '480px', width: '100%' };
  readonly errorStyle    = { fontSize: '0.8125rem', color: DS.colors.red, background: DS.colors.redSubtle, border: `1px solid ${DS.colors.redBorder}`, borderRadius: DS.radius.md, padding: '9px 12px' };
  readonly emptyStyle    = { padding: '32px', textAlign: 'center' as const, color: DS.colors.fg3, fontSize: '0.875rem' };
}