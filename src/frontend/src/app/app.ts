import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderNavComponent } from './components/header-nav/header-nav'

@Component({
  selector: 'app-root',
  imports: [HeaderNavComponent, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
}
