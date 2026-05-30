import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-oauth-callback',
  templateUrl: './oauth-callback.html',
  styleUrls: ['./oauth-callback.css']
})
export class OAuthCallbackComponent implements OnInit {
  constructor(private route: ActivatedRoute, private router: Router, private auth: AuthService) {}

  ngOnInit() {
    this.route.fragment.subscribe(fragment => {
      if (this.auth.handleOAuthCallback(fragment || '')) {
        this.router.navigate(['/']);
      } else {
        this.router.navigate(['/login'], { queryParams: { error: 'oauth_failed' } });
      }
    });
  }
}