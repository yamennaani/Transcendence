import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { NgStyle, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { DS } from '../tokens';
import { TabListComponent, TabDirective } from '../shared/tabs.component';
import { AvatarComponent } from '../shared/avatar.component';
import { BtnComponent } from '../shared/btn.component';
import { ListComponent } from '../shared/list.component';
import { FieldComponent } from '../shared/field.component';
import { ContainerComponent, ContainerConfig } from '../shared/container.component';
import { CreateClassPage } from '../shared/CreateClassPage';
import { FieldType, SelectField } from '../shared/field.types';
import { AuthService } from '../auth.service';
import { CourseService } from '../core/services/course-service/course-service';
import { AssignmentService, AssignmentResponse } from '../core/services/course-service/Assignment.service';
import { OrgService } from '../core/services/org-service/org-service';
import { LoadingService } from '../core/services/loading-service/loading.service';

export interface BocalClass {
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

const ANALYTICS = [
  { label: 'Completion rate',            value: '—', sub: 'avg across all classes',    color: DS.colors.violet },
  { label: 'Avg evaluations/submission', value: '—', sub: 'target: 3.0',               color: DS.colors.cyan   },
  { label: 'Pass rate',                  value: '—', sub: 'students hitting threshold', color: DS.colors.green  },
  { label: 'Pending evaluations',        value: '—', sub: 'across all assignments',     color: DS.colors.amber  },
];

@Component({
  selector: 'app-bocal-panel',
  standalone: true,
  imports: [
    NgStyle, DatePipe,
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
  router = inject(Router);

  // ── Tab state ──────────────────────────────────────────────
  activeTab = signal(0);

  onTabChanged(i: number) {
    this.activeTab.set(i);
    if (i !== 0) this.selectedClass.set(null);
  }

  // ── Modal visibility ───────────────────────────────────────
  showNew       = signal(false);
  showAddMember = signal(false);
  showAddAssign = signal(false);

  // ── Data signals ───────────────────────────────────────────
  classes          = signal<BocalClass[]>([]);
  members          = signal<OrgMember[]>([]);
  selectedClass    = signal<BocalClass | null>(null);
  classAssignments = signal<AssignmentResponse[]>([]);
  analytics        = ANALYTICS;

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

  ngOnInit() { this.loadAll(); }

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

    if (!email)    { this.memberError.set('Email is required.');    return; }
    if (!username) { this.memberError.set('Username is required.'); return; }
    if (!orgId)    { this.memberError.set('No organization found.'); return; }

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
        this.memberError.set(err?.error?.message ?? 'Failed to add member.');
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
    if (!name)                         { this.assignmentError.set('Name is required.'); return; }
    if (!desc)                         { this.assignmentError.set('Description is required.'); return; }
    if (isNaN(maxScore) || maxScore <= 0) { this.assignmentError.set('Enter a valid max score.'); return; }
    if (isNaN(reqEval)  || reqEval  <= 0) { this.assignmentError.set('Enter a valid required evals count.'); return; }

    this.assignmentError.set(null);
    this.loading.show();
    this.assignService.createAssignment(cls.id, { name, description: desc, maxScore, reqEval }).subscribe({
      next: (a) => {
        this.classAssignments.update(list => [...list, a]);
        this.classes.update(list => list.map(c =>
          c.id === cls.id ? { ...c, assignmentCount: c.assignmentCount + 1 } : c
        ));
        this.closeAssignModal();
        this.loading.hide();
      },
      error: (err) => {
        this.assignmentError.set(err?.error?.message ?? 'Failed to create assignment.');
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
  readonly overlineStyle = { fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.12em', textTransform: 'uppercase', color: DS.colors.cyan, marginBottom: '6px' };
  readonly h1Style       = { fontFamily: DS.fonts.display, fontSize: '1.75rem', fontWeight: '700', letterSpacing: '-0.03em', color: DS.colors.fg1 };
  readonly overlayStyle  = { position: 'fixed', inset: '0', background: 'oklch(0% 0 0 / 0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: '100' };
  readonly modalStyle    = { background: DS.colors.surface, border: `1px solid ${DS.colors.border}`, borderRadius: '16px', padding: '28px', width: '440px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 8px 32px oklch(0% 0 0 / 0.8)' };
  readonly tableStyle    = { background: DS.colors.surface, border: `1px solid ${DS.colors.border}`, borderRadius: '12px', overflow: 'hidden' };
  readonly thStyle       = { padding: '10px 16px', fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', color: DS.colors.fg3, borderBottom: `1px solid ${DS.colors.border}` };
  readonly tdStyle       = { padding: '12px 16px', borderBottom: `1px solid ${DS.colors.borderSubtle}`, fontSize: '0.875rem', color: DS.colors.fg2, display: 'flex', alignItems: 'center' };
  readonly emptyStyle    = { textAlign: 'center', padding: '48px', color: DS.colors.fg3, fontSize: '0.9rem' };
  readonly errorStyle    = { fontSize: '0.8125rem', color: DS.colors.red, background: DS.colors.redSubtle, border: `1px solid ${DS.colors.redBorder}`, borderRadius: DS.radius.md, padding: `${DS.space[2]} ${DS.space[3]}` };
  readonly crumbStyle    = { fontSize: '0.8125rem', color: DS.colors.violet, cursor: 'pointer', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px' };
}
