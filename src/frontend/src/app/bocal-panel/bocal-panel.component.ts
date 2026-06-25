import { Component, inject, computed } from '@angular/core';
import { NgStyle } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { DS } from '../tokens';
import { BtnComponent } from '../shared/btn.component';
import { MatIcon } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

interface BocalTab {
  label: string;
  icon: string;
  path: string;
}

const TABS: BocalTab[] = [
  { label: 'tab_classes',   icon: 'school',     path: 'classes' },
  { label: 'tab_students',  icon: 'people',     path: 'students' },
  { label: 'tab_analytics', icon: 'bar_chart',  path: 'analytics' },
];

@Component({
  selector: 'app-bocal-panel',
  standalone: true,
  imports: [NgStyle, BtnComponent, MatIcon, RouterOutlet, TranslateModule],
  templateUrl: './bocal-panel.component.html',
})
export class BocalPanelComponent {
  router = inject(Router);

  readonly tabs = TABS;

  /** Tracks the active section from the current URL so each section keeps its own route + query params. */
  private currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  activeTab = computed(() => {
    const url = this.currentUrl();
    return this.tabs.findIndex(t => url.includes(`/bocal/${t.path}`));
  });

  selectTab(tab: BocalTab) {
    this.router.navigate(['/bocal', tab.path]);
  }

  // ── Styles ─────────────────────────────────────────────────
  readonly pageStyle  = { flex: '1', overflowY: 'auto', padding: '32px' };
  readonly navStyle   = { display: 'flex', flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: DS.space[1], marginBottom: '20px' };
}