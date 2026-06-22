import { Component, inject, signal, computed } from '@angular/core';
import { NgStyle } from '@angular/common';
import { Router } from '@angular/router';
import { DS } from '../tokens';
import { AvatarComponent } from '../shared/avatar.component';
import { BtnComponent } from '../shared/btn.component';
import { AuthService } from '../services/auth.service';
import { LoadingService } from '../core/services/loading-service/loading.service';
import { EvalService, EvalSection, StartEvaluationResponse } from '../core/services/eval-service/eval-service';

@Component({
  selector: 'app-evaluation-flow',
  standalone: true,
  imports: [NgStyle, AvatarComponent, BtnComponent],
  templateUrl: './evaluation-flow.component.html',
  styles: [`
    .section-card {
      background: ${DS.colors.surface};
      border: 1px solid ${DS.colors.border};
      border-radius: 14px;
      padding: 22px 24px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .section-title {
      font-family: ${DS.fonts.display};
      font-size: 1.125rem;
      font-weight: 700;
      color: ${DS.colors.fg1};
      margin-bottom: 6px;
    }
    .section-desc {
      font-size: 0.9375rem;
      color: ${DS.colors.fg2};
      line-height: 1.6;
    }
    .big-toggle-row {
      display: flex;
      gap: 14px;
    }
    .big-toggle-btn {
      flex: 1;
      padding: 22px 16px;
      border-radius: 12px;
      font-family: ${DS.fonts.display};
      font-size: 1.25rem;
      font-weight: 700;
      cursor: pointer;
      border: 2px solid ${DS.colors.border};
      background: ${DS.colors.surfaceRaised};
      color: ${DS.colors.fg2};
      transition: all 150ms;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    .big-toggle-btn:hover { border-color: ${DS.colors.violetBorder}; }
    .big-toggle-pts {
      font-family: ${DS.fonts.mono};
      font-size: 0.8125rem;
      font-weight: 500;
      opacity: 0.75;
    }
    .big-toggle-btn.yes.selected {
      background: ${DS.colors.greenSubtle};
      border-color: ${DS.colors.greenBorder};
      color: ${DS.colors.green};
    }
    .big-toggle-btn.no.selected {
      background: ${DS.colors.redSubtle};
      border-color: ${DS.colors.redBorder};
      color: ${DS.colors.red};
    }
    .big-slider-wrap {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .big-slider-value {
      font-family: ${DS.fonts.display};
      font-size: 2rem;
      font-weight: 700;
      color: ${DS.colors.violet};
    }
    .big-slider-max {
      font-size: 1rem;
      font-weight: 500;
      color: ${DS.colors.fg3};
    }
    .big-slider {
      width: 100%;
      height: 14px;
      border-radius: 999px;
      accent-color: ${DS.colors.violet};
      cursor: pointer;
    }
    .feedback-panel {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 32px;
    }
    .feedback-card { text-align: center; max-width: 420px; }
  `],
})
export class EvaluationFlowComponent {
  router  = inject(Router);
  private auth         = inject(AuthService);
  private evalService  = inject(EvalService);
  private loading      = inject(LoadingService);

  // ── Phase 1: passkey "login" ────────────────────────────────
  phase       = signal<'login' | 'flow'>('login');
  leaderEmail = signal('');
  passkeyInput = signal('');
  loginError  = signal<string | null>(null);

  // ── Phase 2: eval sheet ──────────────────────────────────────
  session   = signal<StartEvaluationResponse | null>(null);
  submitted = signal(false);
  sectionScores = signal<Map<number, number | null>>(new Map());
  comment  = signal('');
  submitError = signal<string | null>(null);

  sections   = computed(() => this.session()?.evalSheet.sections ?? []);
  maxScore   = computed(() => this.session()?.assignment.max_score ?? 0);
  allScored  = computed(() => this.sections().every(s => this.sectionScores().get(s.id) != null));
  totalScore = computed(() => [...this.sectionScores().values()].reduce((sum: number, v) => sum + (v ?? 0), 0));
  commentOk  = computed(() => this.comment().trim().length >= 20);
  canSubmit  = computed(() => this.allScored() && this.commentOk());

  scoreColor = computed(() => {
    const max = this.maxScore();
    const pct = max > 0 ? (this.totalScore() / max) * 100 : 0;
    return pct >= 80 ? DS.colors.green : pct >= 50 ? DS.colors.amber : DS.colors.red;
  });

  // ── Login step ───────────────────────────────────────────────
  login() {
    const evaluatorUserId = this.auth.user()?.id;
    const leaderEmail = this.leaderEmail().trim();
    const passkey = this.passkeyInput().trim();

    if (!evaluatorUserId) { this.loginError.set('Could not identify your account. Please refresh and try again.'); return; }
    if (!leaderEmail)     { this.loginError.set("Enter the evaluee's leader email."); return; }
    if (!passkey)         { this.loginError.set('Enter the passkey.'); return; }

    this.loginError.set(null);
    this.loading.show();
    this.evalService.startEvaluation({ evaluatorUserId, leaderEmail, passkey }).subscribe({
      next: (res) => {
        this.session.set(res);
        const initial = new Map<number, number | null>();
        for (const s of res.evalSheet.sections) initial.set(s.id, s.sectionType === 'Slider' ? 0 : null);
        this.sectionScores.set(initial);
        this.comment.set('');
        this.submitError.set(null);
        this.submitted.set(false);
        this.phase.set('flow');
        this.loading.hide();
      },
      error: (err) => {
        this.loginError.set(err?.error?.error ?? 'Could not start this evaluation. Check the email and passkey.');
        this.loading.hide();
      },
    });
  }

  // ── Grading ──────────────────────────────────────────────────
  setToggle(section: EvalSection, value: boolean) {
    this.sectionScores.update(map => new Map(map).set(section.id, value ? section.marks : 0));
  }

  setSlider(section: EvalSection, value: number) {
    this.sectionScores.update(map => new Map(map).set(section.id, value));
  }

  scoreFor(sectionId: number): number | null {
    return this.sectionScores().get(sectionId) ?? null;
  }

  isToggleSelected(section: EvalSection, value: boolean): boolean {
    const score = this.scoreFor(section.id);
    if (score == null) return false;
    return value ? score === section.marks : score === 0;
  }

  // ── Submit ───────────────────────────────────────────────────
  submit() {
    const session = this.session();
    const evaluatorUserId = this.auth.user()?.id;
    if (!session || !evaluatorUserId || !this.canSubmit()) return;

    const scores = this.sections().map(s => ({ sectionId: s.id, score: this.scoreFor(s.id) ?? 0 }));

    this.submitError.set(null);
    this.loading.show();
    this.evalService.submitEvaluation({
      evalAssignmentId: session.evalAssignmentId,
      evaluatorUserId,
      comment: this.comment().trim(),
      scores,
    }).subscribe({
      next: () => {
        this.loading.hide();
        this.submitted.set(true);
      },
      error: (err) => {
        this.submitError.set(err?.error?.error ?? 'Failed to submit the evaluation.');
        this.loading.hide();
      },
    });
  }

  // Shared styles
  readonly pageStyle = { flex: '1', overflowY: 'auto', padding: '32px', maxWidth: '720px', display: 'flex', flexDirection: 'column' as const, gap: '20px' };
  readonly crumbStyle = { fontSize: '0.8125rem', color: DS.colors.fg3, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' };
  readonly h1Style = { fontFamily: DS.fonts.display, fontSize: '1.75rem', fontWeight: '700', letterSpacing: '-0.03em', color: DS.colors.fg1, marginBottom: '4px' };
  readonly subStyle = { fontSize: '0.9375rem', color: DS.colors.fg2 };
  readonly subCardStyle = { background: DS.colors.surface, border: `1px solid ${DS.colors.border}`, borderRadius: '12px', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px' };
  readonly panelStyle = { background: DS.colors.surface, border: `1px solid ${DS.colors.border}`, borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column' as const, gap: '16px' };
  readonly sectionHeadStyle = { fontFamily: DS.fonts.display, fontSize: '1rem', fontWeight: '600', color: DS.colors.fg1, marginBottom: '4px' };
  readonly textareaStyle = { width: '100%', boxSizing: 'border-box' as const, background: DS.colors.surfaceRaised, border: `1px solid ${DS.colors.border}`, borderRadius: '8px', padding: '14px 16px', fontFamily: DS.fonts.body, fontSize: '0.9375rem', color: DS.colors.fg1, outline: 'none', resize: 'vertical' as const, minHeight: '120px', lineHeight: '1.6' };
  readonly donePgStyle = { flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' };
  readonly doneCardStyle = { textAlign: 'center' as const, maxWidth: '400px' };
  readonly inputStyle = { width: '100%', boxSizing: 'border-box' as const, padding: '9px 12px', background: DS.colors.bg, border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.md, color: DS.colors.fg1, fontFamily: DS.fonts.body, fontSize: '0.875rem', outline: 'none' };
  readonly fieldLabelStyle = { fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: DS.colors.fg3, marginBottom: '4px', display: 'block' };
  readonly errorStyle = { fontSize: '0.8125rem', color: DS.colors.red, background: DS.colors.redSubtle, border: `1px solid ${DS.colors.redBorder}`, borderRadius: DS.radius.md, padding: `${DS.space[2]} ${DS.space[3]}` };
}
