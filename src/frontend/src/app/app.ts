import { Component, inject, HostBinding } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgStyle } from '@angular/common';
import { AuthService } from './services/auth.service';
import { SidebarComponent } from './shared/sidebar.component';
import { LoadingSpinnerComponent } from './shared/loading-spinner.component';
import { DS } from './tokens';
import { LanguageSwitcherComponent } from './languages/language-switcher.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgStyle, SidebarComponent, LoadingSpinnerComponent],
  template: `
  <app-loading-spinner/>
    @if (!auth.initialized()) {
      <!-- Hold rendering until the silent token refresh completes -->
    } @else if (auth.isLoggedIn()) {
      <div [ngStyle]="shellStyle">
        <app-sidebar/>
        <main [ngStyle]="mainStyle">
          <router-outlet/>
        </main>
      </div>
    } @else {
      <router-outlet/>
    }
  `,
  styles: [`
  :host { display: block; height: 100vh; overflow: hidden; }
  `],
})
export class AppComponent {
  auth = inject(AuthService);

  @HostBinding('style.height')   get hostHeight()   { return this.auth.isLoggedIn() ? '100vh' : 'auto'; }
  @HostBinding('style.overflow') get hostOverflow() { return this.auth.isLoggedIn() ? 'hidden' : 'auto'; }

  readonly shellStyle = {
    display: 'flex', height: '100vh', overflow: 'hidden',
    background: DS.colors.bg,
  };
  readonly mainStyle = {
    flex: '1', display: 'flex', overflowY: 'auto', overflowX: 'hidden',
  };
}
