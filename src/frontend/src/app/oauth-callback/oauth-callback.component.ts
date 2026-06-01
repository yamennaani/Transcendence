import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  template: `<div class="text-center mt-5">Logging in, please wait...</div>`
})
export class OAuthCallbackComponent implements OnInit {
  constructor(private route: ActivatedRoute, private router: Router, private auth: AuthService) {}

  ngOnInit() {
    this.route.fragment.subscribe(fragment => {
      if (this.auth.handleOAuthCallback(fragment || '')) {
        this.auth.getMe().subscribe({
          next: (user: any) => {
            const dest = (user?.role === 'Admin' || user?.role === 'Bocal') ? '/bocal' : '/dashboard';
            this.router.navigate([dest]);
          },
          error: () => this.router.navigate(['/login'], { queryParams: { error: 'oauth_failed' } })
        });
      } else {
        this.router.navigate(['/login'], { queryParams: { error: 'oauth_failed' } });
      }
    });
  }
}