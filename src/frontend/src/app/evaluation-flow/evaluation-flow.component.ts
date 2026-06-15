import { Component, inject, signal, computed } from '@angular/core';
import { NgStyle } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DS } from '../tokens';
import { AvatarComponent } from '../shared/avatar.component';
import { ScorePillComponent } from '../shared/score-pill.component';
import { BtnComponent } from '../shared/btn.component';

const SUBMISSION = {
  student: 'Jordan Lee', assignment: 'C memory management',
  repo: 'https://github.com/jordan/malloc', submittedAt: '2026-04-18',
};

// Translation keys for the "before you begin" intro list
const INTRO_ITEM_KEYS = [
  'eval_intro_item_1',
  'eval_intro_item_2',
  'eval_intro_item_3',
  'eval_intro_item_4',
];

// Translation keys for the evaluation checklist
const CHECKLIST_KEYS = [
  'eval_check_compile',
  'eval_check_functions',
  'eval_check_null',
];

@Component({
  selector: 'app-evaluation-flow',
  standalone: true,
  imports: [NgStyle, AvatarComponent, ScorePillComponent, BtnComponent, TranslateModule],
  templateUrl: './evaluation-flow.component.html',
})
export class EvaluationFlowComponent {
  router  = inject(Router);
  private translate = inject(TranslateService);

  step     = signal<0 | 1 | 2 | 3 | 4>(0);
  answers  = signal<Record<number, boolean>>({});
  score    = signal(80);
  feedback = signal('');

  sub = SUBMISSION;

  // ── Translatable lists (rebuilt on language change) ────────
  introItems = signal<string[]>([]);
  checklist  = signal<string[]>([]);

  constructor() {
    this.buildTranslatedLists();
    this.translate.onLangChange.subscribe(() => this.buildTranslatedLists());
  }

  private buildTranslatedLists() {
    this.introItems.set(INTRO_ITEM_KEYS.map(k => this.translate.instant(k)));
    this.checklist.set(CHECKLIST_KEYS.map(k => this.translate.instant(k)));
  }

  allAnswered = computed(() => CHECKLIST_KEYS.every((_, i) => this.answers()[i] != null));
  feedbackOk  = computed(() => this.feedback().trim().length >= 20);

  setAnswer(i: number, val: boolean) {
    this.answers.update(a => ({ ...a, [i]: val }));
  }

  answerBtnStyle(i: number, val: boolean) {
    const chosen = this.answers()[i] === val;
    if (val) return chosen
      ? { background: DS.colors.violet, color: '#fff', border: `1px solid ${DS.colors.violet}` }
      : { background: 'transparent', color: DS.colors.fg2, border: `1px solid ${DS.colors.border}` };
    return chosen
      ? { background: DS.colors.redSubtle, color: DS.colors.red, border: `1px solid ${DS.colors.redBorder}` }
      : { background: 'transparent', color: DS.colors.fg2, border: `1px solid ${DS.colors.border}` };
  }

  checkRowStyle(i: number) {
    const a = this.answers()[i];
    return {
      background: DS.colors.surface,
      border: `1px solid ${a == null ? DS.colors.border : a ? DS.colors.greenBorder : DS.colors.redBorder}`,
      borderRadius: '10px', padding: '14px 18px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
    };
  }

  scoreColor = computed(() =>
    this.score() >= 80 ? DS.colors.green : this.score() >= 50 ? DS.colors.amber : DS.colors.red
  );

  // Shared styles
  readonly pageStyle = { flex: '1', overflowY: 'auto', padding: '32px', maxWidth: '720px' };
  readonly crumbStyle = { fontSize: '0.8125rem', color: DS.colors.fg3, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' };
  readonly h1Style = { fontFamily: DS.fonts.display, fontSize: '1.75rem', fontWeight: '700', letterSpacing: '-0.03em', color: DS.colors.fg1, marginBottom: '4px' };
  readonly subStyle = { fontSize: '0.9375rem', color: DS.colors.fg2, marginBottom: '24px' };
  readonly subCardStyle = { background: DS.colors.surface, border: `1px solid ${DS.colors.border}`, borderRadius: '12px', padding: '16px 18px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '14px' };
  readonly panelStyle = { background: DS.colors.surface, border: `1px solid ${DS.colors.border}`, borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' };
  readonly sectionHeadStyle = { fontFamily: DS.fonts.display, fontSize: '1rem', fontWeight: '600', color: DS.colors.fg1, marginBottom: '4px' };
  readonly textareaStyle = { width: '100%', background: DS.colors.surfaceRaised, border: `1px solid ${DS.colors.border}`, borderRadius: '8px', padding: '10px 14px', fontFamily: DS.fonts.body, fontSize: '0.9375rem', color: DS.colors.fg1, outline: 'none', resize: 'vertical' as const, minHeight: '100px', lineHeight: '1.6' };
  readonly reviewRowStyle = { background: DS.colors.surfaceRaised, borderRadius: '8px', padding: '10px 14px' };
  readonly donePgStyle = { flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' };
  readonly doneCardStyle = { textAlign: 'center', maxWidth: '400px' };
}
