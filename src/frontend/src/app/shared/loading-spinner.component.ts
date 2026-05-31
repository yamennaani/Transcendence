import { Component, inject } from "@angular/core";
import { LoadingService } from "../core/services/loading-service/loading.service";
import { DS } from "../tokens";

@Component({
  selector: "app-loading-spinner",
  standalone: true,
  template: `
    @if (loading()) {
      <div class="overlay">
        <div class="shape"></div>
      </div>
    }
  `,
  styles: [`
    .overlay {
      position: fixed;
      inset: 0;
      background: ${DS.colors.bg}cc;
      display: grid;
      place-items: center;
      z-index: 9999;
      backdrop-filter: blur(3px);
    }
    .shape {
      width: 36px;
      height: 36px;
      background: ${DS.colors.violetSubtle};
      border: 2.5px solid ${DS.colors.violet};
      border-radius: 8px;
      animation: morph-spin 1.1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    }
    @keyframes morph-spin {
      0%   { transform: rotate(0deg)   scale(1);    border-radius: 8px;  }
      25%  { transform: rotate(90deg)  scale(0.88); border-radius: 28%;  }
      50%  { transform: rotate(180deg) scale(0.76); border-radius: 50%;  }
      75%  { transform: rotate(270deg) scale(0.88); border-radius: 28%;  }
      100% { transform: rotate(360deg) scale(1);    border-radius: 8px;  }
    }
  `]
})
export class LoadingSpinnerComponent {
  protected loading = inject(LoadingService).loading;
}
