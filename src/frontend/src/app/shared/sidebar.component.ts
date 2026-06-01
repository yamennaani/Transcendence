import { Component, inject, signal, computed } from '@angular/core';
import { NgStyle } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { DS } from '../tokens';
import { LogoComponent } from '../shared/logo.component';
import { AvatarComponent } from '../shared/avatar.component';
import { IconComponent } from '../shared/icon.component';
import { AppIconSettings } from './field.types';
import { LanguageSwitcherComponent } from '../languages/language-switcher.component';

interface NavItem { label: string; route: string; icon: string; roles: string[]; badge?: number; }

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',   route: '/dashboard',          icon: 'dashboard',  roles: ['Student','Bocal','Admin'] },
  { label: 'My classes',  route: '/classes',            icon: 'book',       roles: ['Student'] },
  { label: 'Assignments', route: '/assignment',         icon: 'file',       roles: ['Student','Bocal','Admin'] },
  { label: 'Evaluations', route: '/evaluation',         icon: 'star',       roles: ['Student'], badge: 2 },
  { label: 'Progress',    route: '/progress',           icon: 'trending',   roles: ['Student'] },
  { label: 'Manage',      route: '/bocal',              icon: 'building',   roles: ['Bocal','Admin'] },
  { label: 'Users',       route: '/users',              icon: 'users',      roles: ['Admin'] },
];

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [NgStyle, LogoComponent, IconComponent, RouterLink, LanguageSwitcherComponent],
  template: `
    <nav [ngStyle]="navStyle">
      <!-- Logo -->
      <div [ngStyle]="logoPadStyle">
        <app-logo [size]="20"/>
      </div>

      <!-- User chip -->
      <div [ngStyle]="chipStyle"
      (click)="goToProfile()"
      style="cursor: pointer;">
        <!-- Replace app-avatar with app-icon -->
        <app-icon [settings]="avatarSettings()" 
        [allowEdit]="false"
        (iconChanged)="onAvatarChanged($event)"/>
        <div style="flex:1;min-width:0">
          <div [ngStyle]="userNameStyle">{{ user()?.username }}</div>
          <div [ngStyle]="roleStyle()">{{ user()?.role }}</div>
        </div>
      </div>

      <!-- Nav items -->
      <div style="flex:1;padding:12px 8px;display:flex;flex-direction:column;gap:2px;overflow-y:auto">
        @for (item of visibleItems(); track item.route) {
          <a [routerLink]="item.route" [ngStyle]="itemStyle(item.route)"
             (mouseenter)="hovered.set(item.route)"
             (mouseleave)="hovered.set('')">
            <span [innerHTML]="icons[item.icon]" style="display:flex;align-items:center;width:16px;height:16px;flex-shrink:0"></span>
            <span style="flex:1">{{ item.label }}</span>
            @if (item.badge) {
              <span [ngStyle]="badgePillStyle">{{ item.badge }}</span>
            }
          </a>
        }
      </div>

      <!-- Bottom -->
      <div style="padding:8px;border-top:1px solid oklch(22% 0.025 272)">
        <div [ngStyle]="itemStyle('')" style="text-decoration:none">
          <app-language-switcher/>
        </div>
        <a [ngStyle]="itemStyle('/settings')" style="text-decoration:none" href="#">Settings</a>
        <a [ngStyle]="itemStyle('/logout')" (click)="logout()" style="text-decoration:none;cursor:pointer">Sign out</a>
      </div>
    </nav>
  `,
  styles: [`a { text-decoration: none; }`],
})
export class SidebarComponent {
  private auth   = inject(AuthService);
  private router = inject(Router);

  user    = this.auth.user;
  hovered = signal('');

  visibleItems = computed(() => {
    const role = this.user()?.role ?? 'Student';
    return NAV_ITEMS.filter(i => i.roles.includes(role));
  });

  logout() { this.auth.logout(); this.router.navigate(['/login']); }

    // Create avatar settings computed from user data
  avatarSettings = computed<AppIconSettings>(() => ({
    name: this.user()?.username ?? '',
    icon: this.user()?.profile?.avatar ?? undefined, // Assuming user has avatar URL
    size: 32,
    borderRadius: 0, // 8% for slightly rounded, change as needed
    allowView: false,
    allowEdit: false, // Set to true if you want upload from sidebar
  }));

  // Handle avatar change if you enable editing
  onAvatarChanged(newIconUrl: string) {
    // Update user avatar in your backend
    console.log('Avatar changed:', newIconUrl);
    // You would call an API to update the avatar here
  }

  // Icon SVG strings (Lucide-compatible inline SVG, stroke 1.5)
  readonly icons: Record<string, string> = {
    dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
    book:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
    file:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
    star:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    trending:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
    building:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>`,
    users:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  };

  // Styles
  readonly navStyle = {
    width: '240px', height: '100vh', background: DS.colors.surface,
    borderRight: `1px solid ${DS.colors.border}`,
    display: 'flex', flexDirection: 'column', flexShrink: '0', position: 'sticky', top: '0',
  };
  readonly logoPadStyle = {
    padding: '20px 16px 16px', borderBottom: `1px solid ${DS.colors.borderSubtle}`,
  };
  readonly chipStyle = {
    padding: '12px 16px', borderBottom: `1px solid ${DS.colors.borderSubtle}`,
    display: 'flex', alignItems: 'center', gap: '10px',
  };
  readonly userNameStyle = {
    fontSize: '0.875rem', fontWeight: '500', color: DS.colors.fg1,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  };
  readonly badgePillStyle = {
    fontFamily: DS.fonts.mono, fontSize: '0.6875rem',
    background: DS.colors.violet, color: '#fff', borderRadius: '9999px', padding: '1px 7px',
  };

  roleStyle = computed(() => {
    const r = this.user()?.role;
    return {
      fontSize: '0.6875rem', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase',
      color: r === 'Bocal' ? DS.colors.cyan : r === 'Admin' ? DS.colors.violet : DS.colors.fg3,
    };
  });

  itemStyle(route: string) {
    const active  = this.router.url === route;
    const hovered = this.hovered() === route;
    return {
      display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px',
      borderRadius: '8px', cursor: 'pointer', transition: 'all 150ms',
      background: active ? DS.colors.violetSubtle : hovered ? DS.colors.surfaceRaised : 'transparent',
      color:  active ? DS.colors.violet : hovered ? DS.colors.fg1 : DS.colors.fg2,
      border: `1px solid ${active ? DS.colors.violetBorder : 'transparent'}`,
      fontSize: '0.875rem', fontWeight: active ? '500' : '400',
      fontFamily: DS.fonts.body, textDecoration: 'none',
    };
  }

  goToProfile(){
    this.router.navigate(['user-profile'])
  }
}
