import { Component, input, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

// Material UI Imports
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';

import { DS } from '../tokens';

/**
 * Configuration for a single column in the generic list
 */
export interface ListColumnConfig<T> {
  key: keyof T;
  label: string;
  width?: string;
  render?: (item: T) => string | number;
}

/**
 * Configuration for badge display
 */
export interface ListBadgeConfig<T> {
  show: (item: T) => boolean;
  variant?: 'validated' | 'failed' | 'under_review' | 'submitted' | 'pending' | 'violet' | 'cyan';
  label: string;
}

/**
 * Configuration for row styling
 */
export interface ListRowConfig<T> {
  hoverBg?: string;
  defaultBg?: string;
  borderColor?: (item: T) => string;
}

/**
 * Progress data structure
 */
export interface ProgressData {
  value: number;
  max: number;
  label: string;
}

/**
 * Main configuration for the generic list
 */
export interface GenericListConfig<T> {
  title: string;
  subtitle?: string;
  columns: ListColumnConfig<T>[];
  rowConfig?: ListRowConfig<T>;
  badge?: ListBadgeConfig<T>;
  emptyMessage?: string;
  trackBy: (item: T) => string | number;
  onRowClick?: (item: T) => void;
}

@Component({
  selector: 'app-generic-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressBarModule,
    MatCardModule,
  ],
  template: `
    <div class="list-container">
      <!-- Header -->
      <div class="list-header">
        <div class="list-overline">{{ config().subtitle || 'List' }}</div>
        <h1 class="list-title">{{ config().title }}</h1>
      </div>

      <!-- Items Container -->
      <div class="list-items">
        @if ((items() ?? []).length > 0) {
          @for (item of items() ?? []; track config().trackBy(item)) {
            <mat-card
              class="list-item"
              [class.hovered]="hoveredId() === getItemId(item)"
              (mouseenter)="hoveredId.set(getItemId(item))"
              (mouseleave)="hoveredId.set(null)"
              (click)="onItemClick(item)">
              
              <!-- Row Content -->
              <mat-card-content>
                <div class="row-header">
                  <div class="row-info">
                    <!-- First Column (Title) -->
                    @for (column of config().columns; let idx = $index; track column.key) {
                      @if (idx === 0) {
                        <div class="row-title">{{ column.render ? column.render(item) : item[column.key] }}</div>
                      }
                    }

                    <!-- Meta Row (Other Columns) -->
                    @if (config().columns.length > 1) {
                      <div class="row-meta">
                        @for (column of config().columns; let idx = $index; track idx) {
                          @if (idx > 0) {
                            <span class="meta-item">{{ column.render ? column.render(item) : item[column.key] }}</span>
                            @if (idx < config().columns.length - 1) {
                              <span class="meta-separator">·</span>
                            }
                          }
                        }
                      </div>
                    }
                  </div>

                  <!-- Badge -->
                  @if (config().badge?.show(item)) {
                    <mat-chip
                      [highlighted]="config().badge?.variant === 'validated'"
                      class="badge-chip">
                      {{ config().badge?.label }}
                    </mat-chip>
                  }
                </div>

                <!-- Progress Bar -->
                @if (getProgressData(item); as prog) {
                  <div class="progress-section">
                    <mat-progress-bar
                      mode="determinate"
                      [value]="(prog.value / prog.max) * 100"
                      color="accent">
                    </mat-progress-bar>
                    <div class="progress-label">{{ prog.label }}</div>
                  </div>
                }
              </mat-card-content>
            </mat-card>
          }
        } @else {
          <!-- Empty State -->
          <div class="empty-state">
            <mat-icon class="empty-icon">inbox</mat-icon>
            <p>{{ config().emptyMessage || 'No items found' }}</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .list-container {
      flex: 1;
      overflow-y: auto;
      padding: 32px;
    }

    .list-header {
      margin-bottom: 28px;
    }

    .list-overline {
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: ${DS.colors.violet};
      margin-bottom: 6px;
    }

    .list-title {
      font-family: ${DS.fonts.display};
      font-size: 2rem;
      font-weight: 700;
      letter-spacing: -0.03em;
      color: ${DS.colors.fg1};
      margin: 0;
    }

    .list-items {
      display: flex;
      flex-direction: column;
      gap: 14px;
      max-width: 700px;
    }

    .list-item {
      cursor: pointer;
      transition: all 150ms ease-in-out;
      background-color: ${DS.colors.surface};
    }

    .list-item:hover {
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    }

    .list-item.hovered {
      background-color: ${DS.colors.surfaceRaised};
    }

    .row-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 14px;
    }

    .row-info {
      flex: 1;
    }

    .row-title {
      font-family: ${DS.fonts.display};
      font-size: 1.125rem;
      font-weight: 600;
      color: ${DS.colors.fg1};
      margin-bottom: 3px;
    }

    .row-meta {
      font-size: 0.8125rem;
      color: ${DS.colors.fg3};
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .meta-item {
      white-space: nowrap;
    }

    .meta-separator {
      color: ${DS.colors.fg3};
      margin: 0 4px;
    }

    .badge-chip {
      height: auto;
      padding: 4px 12px;
    }

    .progress-section {
      margin-top: 12px;
    }

    .progress-label {
      font-size: 0.75rem;
      color: ${DS.colors.fg2};
      margin-top: 6px;
    }

    .empty-state {
      padding: 32px;
      text-align: center;
      color: ${DS.colors.fg2};
    }

    .empty-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin: 0 auto;
      opacity: 0.5;
    }

    mat-card {
      border: 1px solid ${DS.colors.border};
      border-radius: 12px;
    }
  `],
})
export class GenericListComponent<T> {
  config = input.required<GenericListConfig<T>>();
  items = input.required<T[] | null>();
  progressDataFn = input<((item: T) => ProgressData | null) | null>(null);

  @Output() itemClicked = new EventEmitter<T>();

  hoveredId = signal<string | number | null>(null);

  /**
   * Get the ID for an item (used for tracking hover state)
   */
  getItemId(item: T): string | number {
    return this.config().trackBy(item);
  }

  /**
   * Handle item click
   */
  onItemClick(item: T): void {
    this.config().onRowClick?.(item);
    this.itemClicked.emit(item);
  }

  /**
   * Get progress data for an item
   */
  getProgressData(item: T): ProgressData | null {
    const fn = this.progressDataFn();
    if (!fn) return null;
    return fn(item) ?? null;
  }
}