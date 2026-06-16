import { Component, OnInit, inject } from '@angular/core';
import { NgStyle } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DS } from '../../tokens';
import { ContainerComponent, ContainerConfig } from '../../shared/container.component';

@Component({
  selector: 'app-bocal-analytics',
  standalone: true,
  imports: [NgStyle, ContainerComponent, TranslateModule],
  templateUrl: './bocal-analytics.component.html',
})
export class BocalAnalyticsComponent implements OnInit {
  private translate = inject(TranslateService);

  analytics: { label: string; value: string; sub: string; color: string }[] = [];

  readonly flatConfig: ContainerConfig = { variant: 'flat', height: 'auto', scrollable: false };
  readonly overlineStyle = { fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: DS.colors.cyan, marginBottom: '6px' };
  readonly h1Style       = { fontFamily: DS.fonts.display, fontSize: '1.75rem', fontWeight: '700', letterSpacing: '-0.03em', color: DS.colors.fg1 };

  ngOnInit() {
    this.buildAnalytics();
    this.translate.onLangChange.subscribe(() => {
      this.buildAnalytics();
    });
  }

  private buildAnalytics() {
    this.analytics = [
      { label: this.translate.instant('label_completion_rate'),    value: '—', sub: this.translate.instant('sub_completion_rate'),    color: DS.colors.violet },
      { label: this.translate.instant('label_avg_evaluations'),    value: '—', sub: this.translate.instant('sub_avg_evaluations'),    color: DS.colors.cyan   },
      { label: this.translate.instant('label_pass_rate'),          value: '—', sub: this.translate.instant('sub_pass_rate'),          color: DS.colors.green  },
      { label: this.translate.instant('label_pending_evaluations'),value: '—', sub: this.translate.instant('sub_pending_evaluations'),color: DS.colors.amber  },
    ];
  }
}