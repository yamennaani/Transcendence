import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { NgStyle } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DS } from '../tokens';
import { BadgeComponent } from '../shared/badge.component';
import { AvatarComponent } from '../shared/avatar.component';
import { ScorePillComponent } from '../shared/score-pill.component';
import { BtnComponent } from '../shared/btn.component';
import { AssignmentService } from '../core/services/course-service/Assignment.service';

const ASSIGNMENT = {
  title: 'C memory management', class: 'Systems programming',
  description: 'Implement a dynamic memory allocator in C. Your implementation must handle malloc, free, calloc, and realloc. The evaluator will test your code with edge cases including null pointers, zero-size allocations, and large blocks.',
  maxScore: 100, bonusScore: 20, requiredEvals: 3,
  submittedAt: '2026-04-18', repoUrl: 'https://github.com/student/malloc',
  evaluations: [
    { evaluator: 'Sofia Reyes', score: 88, feedback: 'Solid implementation. Edge cases for zero-size handled correctly. Free list management could be more efficient.', date: '2026-04-19' },
    { evaluator: 'Marcus K.',   score: 91, feedback: 'Very clean code. Good error handling. Bonus: realloc shrink path is elegant.', date: '2026-04-20' },
  ],
};

@Component({
  selector: 'app-assignment-detail',
  standalone: true,
  imports: [NgStyle, BadgeComponent, AvatarComponent, ScorePillComponent, BtnComponent],
  templateUrl: './assignment-detail.component.html',
})
export class AssignmentDetailComponent implements OnInit{
  router = inject(Router);
  private route = inject(ActivatedRoute);
  private assService = inject(AssignmentService)
  private assId = signal<number | null>(null)

  tab = signal<'detail' | 'evaluations' | 'submission'>('detail');
  a   = ASSIGNMENT;
  avg = computed(() => {
    const e = this.a.evaluations;
    return e.length ? Math.round(e.reduce((s, x) => s + x.score, 0) / e.length) : null;
  });

    ngOnInit(): void {
      console.log('hi')
      this.route.queryParams.subscribe((params)=>{
        if(params['assId']){
          this.assId.set(parseInt(params['assId']))
        }
      })
  }

  tabStyle(id: string) {
    const active = this.tab() === id;
    return {
      fontFamily: DS.fonts.body, fontSize: '0.875rem', fontWeight: '500',
      padding: '8px 16px', border: 'none', cursor: 'pointer', borderRadius: '6px',
      background: active ? DS.colors.violetSubtle : 'transparent',
      color:      active ? DS.colors.violet : DS.colors.fg2,
      transition: 'all 150ms',
    };
  }

  evalDotStyle(i: number) {
    const done = i < this.a.evaluations.length;
    return {
      width: '30px', height: '30px', borderRadius: '50%', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: DS.fonts.mono, fontSize: '0.75rem', fontWeight: '500',
      background: done ? DS.colors.greenSubtle  : DS.colors.surfaceRaised,
      border:     `1.5px solid ${done ? DS.colors.greenBorder : DS.colors.border}`,
      color:      done ? DS.colors.green : DS.colors.fg3,
    };
  }

  // Styles
  readonly pageStyle = { flex: '1', overflowY: 'auto', padding: '32px', maxWidth: '800px' };
  readonly crumbLinkStyle = { cursor: 'pointer', color: DS.colors.violet };
  readonly crumbStyle = { fontSize: '0.8125rem', color: DS.colors.fg3, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' };
  readonly h1Style = { fontFamily: DS.fonts.display, fontSize: '1.75rem', fontWeight: '700', letterSpacing: '-0.03em', color: DS.colors.fg1, marginBottom: '8px' };
  readonly monoMetaStyle = { fontFamily: DS.fonts.mono, fontSize: '0.75rem', color: DS.colors.fg3 };
  readonly panelStyle = { background: DS.colors.surface, border: `1px solid ${DS.colors.border}`, borderRadius: '12px', padding: '20px 22px' };
  readonly evalPanelStyle = { background: DS.colors.surface, border: `1px solid ${DS.colors.border}`, borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '16px' };
  readonly tabBarStyle = { display: 'flex', gap: '4px', marginBottom: '16px', background: DS.colors.surface, borderRadius: '8px', padding: '4px', width: 'fit-content', border: `1px solid ${DS.colors.borderSubtle}` };
  readonly evalCardStyle = { background: DS.colors.surfaceRaised, border: `1px solid ${DS.colors.border}`, borderRadius: '10px', padding: '16px 18px' };
  readonly waitStyle = { background: DS.colors.amberSubtle, border: `1px solid ${DS.colors.amberBorder}`, borderRadius: '10px', padding: '14px 18px' };
}
