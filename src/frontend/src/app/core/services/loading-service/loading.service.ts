import { computed, Injectable, signal } from "@angular/core";

@Injectable({ providedIn: "root" })
export class LoadingService {
  private count = signal(0);
  readonly loading = computed(() => this.count() > 0);

  show() { this.count.update(c => c + 1); }
  hide() { this.count.update(c => Math.max(0, c - 1)); }
}
