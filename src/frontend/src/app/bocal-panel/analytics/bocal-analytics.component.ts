import { Component } from '@angular/core';
import { NgStyle } from '@angular/common';
import { DS } from '../../tokens';
import { ContainerComponent, ContainerConfig } from '../../shared/container.component';

const ANALYTICS = [
  { label: 'Completion rate',            value: '—', sub: 'avg across all classes',    color: DS.colors.violet },
  { label: 'Avg evaluations/submission', value: '—', sub: 'target: 3.0',               color: DS.colors.cyan   },
  { label: 'Pass rate',                  value: '—', sub: 'students hitting threshold', color: DS.colors.green  },
  { label: 'Pending evaluations',        value: '—', sub: 'across all assignments',     color: DS.colors.amber  },
];

@Component({
  selector: 'app-bocal-analytics',
  standalone: true,
  imports: [NgStyle, ContainerComponent],
  templateUrl: './bocal-analytics.component.html',
})
export class BocalAnalyticsComponent {
  analytics = ANALYTICS;

  readonly flatConfig: ContainerConfig = { variant: 'flat', height: 'auto', scrollable: false };
  readonly overlineStyle = { fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: DS.colors.cyan, marginBottom: '6px' };
  readonly h1Style       = { fontFamily: DS.fonts.display, fontSize: '1.75rem', fontWeight: '700', letterSpacing: '-0.03em', color: DS.colors.fg1 };
}