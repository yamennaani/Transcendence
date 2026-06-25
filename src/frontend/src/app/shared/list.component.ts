import {
  Component,
  ContentChild,
  EventEmitter,
  Output,
  TemplateRef,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { BadgeVariant, DS } from '../tokens';
import { ContainerComponent, ContainerConfig } from './container.component';
import { BadgeComponent } from './badge.component';
import { ProgressBarComponent } from './progress-bar.component';
import { BtnComponent } from './btn.component';

export interface ListColumn<T> {
  label: string;
  render: (item: T) => string | number;
}

export interface ListBadge<T> {
  show: (item: T) => boolean;
  variant: BadgeVariant;
  label?: string;
}

export interface ListProgressData {
  value: number;
  max: number;
  label?: string;
}

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [NgTemplateOutlet, ContainerComponent, BadgeComponent, ProgressBarComponent, BtnComponent, TranslateModule],
  template: `
    <div class="list">

      @if (title()) {
        <div class="list-head">
          @if (overline()) { <p class="overline">{{ overline() }}</p> }
          <h1 class="list-title">{{ title() }}</h1>
        </div>
      }

      @if (isPaginated()) {

        <!-- ── Paginated card (CreateClassPage pattern) ── -->
        <div class="paged-card">

          <div class="paged-scroll">
            @if (allItems().length === 0) {
              <p class="empty">{{ emptyMessage() }}</p>
            }
            @for (item of pagedItems(); track trackBy()(item)) {
              <ng-container *ngTemplateOutlet="rowTpl; context: { $implicit: item }"/>
            }
          </div>

          <div class="paged-footer">
            <span class="page-info">
              {{ 'list_page_info' | translate:{start: currentPage() * pageSize() + 1, end: pageEnd(), total: allItems().length} }}
            </span>
            <div class="page-btns">
              @for (p of pages(); track p) {
                <app-btn
                  [variant]="p === currentPage() ? 'secondary' : 'ghost'"
                  size="sm"
                  (clicked)="goTo(p)">
                  {{ p + 1 }}
                </app-btn>
              }
            </div>
          </div>
        </div>

      } @else {

        <!-- ── Flat (no pagination) ── -->
        <div class="list-body">
          @if (allItems().length === 0) {
            <p class="empty">{{ emptyMessage() }}</p>
          }
          @for (item of allItems(); track trackBy()(item)) {
            <ng-container *ngTemplateOutlet="rowTpl; context: { $implicit: item }"/>
          }
        </div>

      }
    </div>

    <!-- ── Row template (shared between both modes) ── -->
    <ng-template #rowTpl let-item>
      <div
        class="row"
        [class.row--clickable]="rowClick.observed"
        (click)="rowClick.emit(item)"
        (mouseenter)="hovered.set(trackBy()(item))"
        (mouseleave)="hovered.set(null)">

        <app-container [config]="rowConfig(item)">
          @if (rowTemplate) {
            <ng-container *ngTemplateOutlet="rowTemplate; context: { $implicit: item }"/>
          } @else {
            <div class="default-row">
              <div class="default-row__header">
                <div class="default-row__info">
                  @if (columns()[0]; as first) {
                    <span class="row-title">{{ first.render(item) }}</span>
                  }
                  @if (metaItems(item).length > 0) {
                    <span class="row-meta">
                      @for (m of metaItems(item); track m; let last = $last) {
                        {{ m }}@if (!last) { <span class="sep"> · </span> }
                      }
                    </span>
                  }
                </div>
                @if (badge() && badge()!.show(item)) {
                  <app-badge [variant]="badge()!.variant" [customLabel]="badge()!.label ?? ''"/>
                }
              </div>
              @if (progress(item); as prog) {
                <app-progress-bar [value]="prog.value" [max]="prog.max" [sublabel]="prog.label ?? ''"/>
              }
            </div>
          }
        </app-container>
      </div>
    </ng-template>
  `,
  styles: [`
    .list {
      display: flex;
      flex-direction: column;
      gap: ${DS.space[6]};
    }

    /* ── Header ── */
    .list-head { display: flex; flex-direction: column; gap: 6px; }

    .overline {
      margin: 0;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: ${DS.colors.violet};
    }

    .list-title {
      margin: 0;
      font-family: ${DS.fonts.display};
      font-size: 2rem;
      font-weight: 700;
      letter-spacing: -0.03em;
      color: ${DS.colors.fg1};
    }

    /* ── Flat layout ── */
    .list-body {
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 680px;
    }

    /* ── Paginated card layout (mirrors CreateClassPage) ── */
    .paged-card {
      display: flex;
      flex-direction: column;
      max-width: 680px;
      background: ${DS.colors.surface};
      border: 1px solid ${DS.colors.border};
      border-radius: ${DS.radius.xl};
      overflow: hidden;
    }

    .paged-scroll {
      display: flex;
      flex-direction: column;
    }

    .paged-footer {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: ${DS.space[3]} ${DS.space[4]};
      border-top: 1px solid ${DS.colors.borderSubtle};
      background: ${DS.colors.surface};
    }

    .page-info {
      font-family: ${DS.fonts.mono};
      font-size: 0.75rem;
      color: ${DS.colors.fg3};
    }

    .page-btns {
      display: flex;
      gap: ${DS.space[1]};
    }

    /* ── Empty ── */
    .empty {
      margin: 0;
      padding: ${DS.space[6]};
      font-size: 0.875rem;
      color: ${DS.colors.fg3};
      text-align: center;
    }

    /* ── Row ── */
    .row { transition: transform 80ms ease; }
    .row--clickable { cursor: pointer; }
    .row--clickable:active { transform: scale(0.995); }

    /* ── Default row content ── */
    .default-row {
      padding: ${DS.space[4]};
      display: flex;
      flex-direction: column;
      gap: ${DS.space[3]};
    }

    .default-row__header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: ${DS.space[3]};
    }

    .default-row__info {
      display: flex;
      flex-direction: column;
      gap: 3px;
      flex: 1;
    }

    .row-title {
      font-family: ${DS.fonts.display};
      font-size: 1.0625rem;
      font-weight: 600;
      color: ${DS.colors.fg1};
    }

    .row-meta { font-size: 0.8125rem; color: ${DS.colors.fg3}; }
    .sep      { color: ${DS.colors.fg3}; }
  `],
})
export class ListComponent<T> {
  private translate = inject(TranslateService);

  items        = input.required<T[] | null>();
  trackBy      = input.required<(item: T) => string | number>();
  columns      = input<ListColumn<T>[]>([]);
  title        = input<string>('');
  overline     = input<string>('');
  emptyMessage = input<string>(this.translate.instant('msg_no_items_found'));
  badge        = input<ListBadge<T> | null>(null);
  progressFn   = input<((item: T) => ListProgressData | null) | null>(null);
  /** Items per page. 0 (default) disables pagination. */
  pageSize = input<number>(0);

  @ContentChild(TemplateRef) rowTemplate?: TemplateRef<{ $implicit: T }>;
  @Output() rowClick = new EventEmitter<T>();

  hovered     = signal<string | number | null>(null);
  currentPage = signal(0);

  allItems   = computed(() => this.items() ?? []);

  totalPages = computed(() =>
    this.pageSize() > 0 ? Math.max(1, Math.ceil(this.allItems().length / this.pageSize())) : 1
  );

  isPaginated = computed(() => this.pageSize() > 0 && this.totalPages() > 1);

  pages = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i));

  pagedItems = computed(() => {
    const start = this.currentPage() * this.pageSize();
    return this.allItems().slice(start, start + this.pageSize());
  });

  pageEnd = computed(() =>
    Math.min((this.currentPage() + 1) * this.pageSize(), this.allItems().length)
  );

  goTo(page: number) {
    this.currentPage.set(page);
    this.hovered.set(null);
  }

  private readonly flatConfig: ContainerConfig = { variant: 'flat', height: 'auto', scrollable: false };
  private readonly cardConfig: ContainerConfig = { variant: 'card', height: 'auto', scrollable: false };

  rowConfig(item: T): ContainerConfig {
    return this.hovered() === this.trackBy()(item) ? this.cardConfig : this.flatConfig;
  }

  metaItems(item: T): string[] {
    return this.columns().slice(1).map(col => String(col.render(item)));
  }

  progress(item: T): ListProgressData | null {
    return this.progressFn()?.(item) ?? null;
  }
}
