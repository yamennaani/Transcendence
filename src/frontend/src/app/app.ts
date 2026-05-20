import { Component, inject, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgStyle } from '@angular/common';
import { AuthService } from './auth.service';
import { SidebarComponent } from './sidebar/sidebar.component';
import { DS } from './tokens';
import { LanguageSwitcherComponent } from './languages/language-switcher.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgStyle, SidebarComponent],
  template: `
    @if (auth.isLoggedIn()) {
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

  readonly shellStyle = {
    display: 'flex', height: '100vh', overflow: 'hidden',
    background: DS.colors.bg,
  };
  readonly mainStyle = {
    flex: '1', overflow: 'hidden', display: 'flex',
  };
}
