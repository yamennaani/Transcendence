import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LogoComponent } from '../shared/logo.component';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [RouterLink, TranslateModule, LogoComponent],
  templateUrl: './privacy-policy.component.html',
  styleUrl: './legal.css',
})
export class PrivacyPolicyComponent {
  readonly lastUpdated = '2026-06-23';
}
