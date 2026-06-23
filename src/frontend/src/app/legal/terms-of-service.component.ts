import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LogoComponent } from '../shared/logo.component';

@Component({
  selector: 'app-terms-of-service',
  standalone: true,
  imports: [RouterLink, TranslateModule, LogoComponent],
  templateUrl: './terms-of-service.component.html',
  styleUrl: './legal.css',
})
export class TermsOfServiceComponent {
  readonly lastUpdated = '2026-06-23';
}
