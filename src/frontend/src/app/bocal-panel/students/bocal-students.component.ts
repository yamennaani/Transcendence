import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { NgStyle, DatePipe } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DS } from '../../tokens';
import { AvatarComponent } from '../../shared/avatar.component';
import { BtnComponent } from '../../shared/btn.component';
import { ListComponent } from '../../shared/list.component';
import { AuthService } from '../../services/auth.service';
import { OrgService } from '../../core/services/org-service/org-service';
import { CourseService } from '../../core/services/course-service/course-service';
import { AssignmentService, AssignmentResponse } from '../../core/services/course-service/Assignment.service';
import { EnrollService } from '../../core/services/enroll-service/enroll-service';
import { LoadingService } from '../../core/services/loading-service/loading.service';

export interface OrgMember {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
}

interface ClassOption { id: number; name: string; }

const ROLE_OPTIONS = ['All', 'Student', 'Bocal', 'Admin'];

@Component({
  selector: 'app-bocal-students',
  standalone: true,
  imports: [
    NgStyle, DatePipe,
    AvatarComponent, BtnComponent, ListComponent,
    TranslateModule,
  ],
  templateUrl: './bocal-students.component.html',
})
export class BocalStudentsComponent implements OnInit {
  private auth          = inject(AuthService);
  private orgService    = inject(OrgService);
  private courseService = inject(CourseService);
  private assignService = inject(AssignmentService);
  private enrollService = inject(EnrollService);
  private loading       = inject(LoadingService);
  private translate     = inject(TranslateService);

  // ── Data signals ───────────────────────────────────────────
  members = signal<OrgMember[]>([]);

  // ── Filters ────────────────────────────────────────────────
  searchQuery  = signal('');
  roleFilter   = signal('All');
  readonly roleOptions = ROLE_OPTIONS;

  // ── Advanced filters: class & subject (assignment) ─────────
  classes  = signal<ClassOption[]>([]);
  subjects = signal<AssignmentResponse[]>([]);
  classFilter   = signal<number | null>(null);
  subjectFilter = signal<number | null>(null);
  classStudentIds   = signal<Set<number> | null>(null);
  subjectStudentIds = signal<Set<number> | null>(null);

  filteredMembers = computed(() => {
    const query    = this.searchQuery().trim().toLowerCase();
    const role     = this.roleFilter();
    const classIds = this.classStudentIds();
    const subjIds  = this.subjectStudentIds();
    return this.members().filter(m => {
      if (role !== 'All' && m.role !== role) return false;
      if (classIds && !classIds.has(m.id)) return false;
      if (subjIds && !subjIds.has(m.id)) return false;
      if (!query) return true;
      return m.username.toLowerCase().includes(query) || m.email.toLowerCase().includes(query);
    });
  });

  students = computed(() => this.members().filter(m => m.role === 'Student'));

  readonly memberTrackFn = (m: OrgMember) => m.id;

  private get orgId() { return this.auth.user()?.orgId; }

  ngOnInit() {
    this.loadMembers();
    this.loadClasses();
  }

  loadMembers() {
    const orgId = this.orgId;
    if (!orgId) return;

    this.loading.show();
    this.orgService.listOrgMembers(orgId).subscribe({
      next: (members) => {
        this.members.set(members as OrgMember[]);
        this.loading.hide();
      },
      error: () => this.loading.hide(),
    });
  }

  loadClasses() {
    const orgId = this.orgId;
    if (!orgId) return;

    this.courseService.getClassByOrgId(orgId).subscribe({
      next: (classes) => this.classes.set(classes.map(c => ({ id: c.id, name: c.name }))),
      error: () => {},
    });
  }

  // ── Remove student from the currently filtered class ───────
  removeFromClass(member: OrgMember) {
    const classId = this.classFilter();
    const cls = this.classes().find(c => c.id === classId);
    if (!classId || !cls) return;
    if (!confirm(this.translate.instant('confirm_remove_from_class', { username: member.username, className: cls.name }))) return;

    this.loading.show();
    this.enrollService.dropStudent({ classId, studentId: member.id }).subscribe({
      next: () => {
        this.classStudentIds.update(ids => {
          if (!ids) return ids;
          const next = new Set(ids);
          next.delete(member.id);
          return next;
        });
        this.loading.hide();
      },
      error: () => this.loading.hide(),
    });
  }

  // ── Advanced filters: class & subject ──────────────────────
  onClassFilterChanged(value: string) {
    const classId = value ? parseInt(value, 10) : null;
    this.classFilter.set(classId);
    this.subjectFilter.set(null);
    this.subjects.set([]);
    this.subjectStudentIds.set(null);

    if (classId === null) {
      this.classStudentIds.set(null);
      return;
    }

    this.courseService.getClassStudents(classId).subscribe({
      next: (students) => this.classStudentIds.set(new Set(students.map(s => s.id))),
      error: () => this.classStudentIds.set(null),
    });
    this.assignService.getAssignments(classId).subscribe({
      next: (assignments) => this.subjects.set(assignments),
      error: () => this.subjects.set([]),
    });
  }

  onSubjectFilterChanged(value: string) {
    const assignmentId = value ? parseInt(value, 10) : null;
    this.subjectFilter.set(assignmentId);

    if (assignmentId === null) {
      this.subjectStudentIds.set(null);
      return;
    }

    this.assignService.getAssignmentById(assignmentId).subscribe({
      next: (assignment) => {
        const ids = new Set<number>();
        for (const group of assignment.groups ?? []) {
          for (const member of group.members ?? []) ids.add(member.userId);
        }
        this.subjectStudentIds.set(ids);
      },
      error: () => this.subjectStudentIds.set(null),
    });
  }

  // ── Add member ─────────────────────────────────────────────
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
  readonly pageStyle       = { display: 'flex', flexDirection: 'column' as const, gap: '0' };
  readonly overlineStyle   = { fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: DS.colors.cyan, marginBottom: '6px' };
  readonly h1Style         = { fontFamily: DS.fonts.display, fontSize: '1.75rem', fontWeight: '700', letterSpacing: '-0.03em', color: DS.colors.fg1 };
  readonly inputStyle      = { width: '100%', boxSizing: 'border-box' as const, padding: '9px 12px', background: DS.colors.bg, border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.md, color: DS.colors.fg1, fontFamily: DS.fonts.body, fontSize: '0.875rem', outline: 'none' };
  readonly filterBarStyle  = { display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' as const };
}