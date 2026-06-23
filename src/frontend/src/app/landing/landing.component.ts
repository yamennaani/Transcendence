import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  HostBinding,
  ViewEncapsulation,
  NgZone,
  inject,
} from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import type { Subscription } from 'rxjs';
import { LogoComponent } from '../shared/logo.component';
import { isSupportedLang, setLanguage } from '../languages/language.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, LogoComponent, TranslateModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
  @HostBinding('style.display') readonly display = 'block';
  @HostBinding('style.overflowX') readonly overflowX = 'hidden';

  private route = inject(ActivatedRoute);
  private translate = inject(TranslateService);
  private langChangeSub?: Subscription;

  // ─── Inject NgZone so we can run all DOM/animation work OUTSIDE it ───────
  // Angular Material imports BrowserAnimationsModule, which makes zone.js
  // intercept every rAF, setInterval, and IntersectionObserver callback and
  // trigger full change-detection runs. During a CSS transition that means
  // the renderer may re-evaluate styles and reset the transition mid-flight,
  // making everything appear to complete instantly. Running outside the zone
  // prevents those interruptions entirely.
  private zone = inject(NgZone);

  private listeners: Array<{ target: EventTarget; type: string; fn: EventListener }> = [];
  private intervals: ReturnType<typeof setInterval>[] = [];
  private observers: IntersectionObserver[] = [];
  private rafId = 0;

  ngOnInit(): void {
    // /:lang (e.g. /en, /de, /ar, /hu) pins the active language before the
    // page renders. Bare "/" leaves whatever language is already active.
    const lang = this.route.snapshot.paramMap.get('lang');
    if (isSupportedLang(lang)) {
      setLanguage(this.translate, lang);
    }
  }

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      // Title and float-cards can start immediately – they use CSS keyframes,
      // not transitions, so they're safe before the first paint.
      this.buildHeroTitle();
      this.langChangeSub = this.translate.onLangChange.subscribe(() => this.buildHeroTitle());
      this.initCursorGlow();
      this.initNavScroll();

      // Everything that relies on CSS *transitions* (reveal, score bars,
      // counters) needs the browser to have painted the initial state first
      // (opacity:0, transform:translateY(30px), width:0).
      //
      // ngAfterViewInit runs synchronously before the browser's first paint.
      // If we start observing right away, the IntersectionObserver fires
      // before the "from" state is committed to the compositor, so the
      // transition has no starting point and just snaps to the end value.
      //
      // Two rAFs guarantee we're past the first painted frame:
      //   rAF 1 → browser schedules the paint
      //   rAF 2 → browser has completed the paint, initial styles are live
      // Then a short setTimeout adds one more tick so the compositor has
      // promoted any will-change layers before we start mutating classes.
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          setTimeout(() => {
            this.initScrollReveal();
            this.initCounters();
            this.initFloatCards();
            this.initPeerGraph();
          }, 60)
        )
      );
    });
  }

  ngOnDestroy(): void {
    this.listeners.forEach(({ target, type, fn }) => target.removeEventListener(type, fn));
    this.intervals.forEach(clearInterval);
    this.observers.forEach(o => o.disconnect());
    cancelAnimationFrame(this.rafId);
    this.langChangeSub?.unsubscribe();
  }

  // ─── Helper: register a listener so it's cleaned up on destroy ───────────
  private listen(
    target: EventTarget,
    type: string,
    fn: EventListener,
    options?: AddEventListenerOptions
  ): void {
    target.addEventListener(type, fn, options);
    this.listeners.push({ target, type, fn });
  }

  // ─── Title: character-by-character reveal via CSS keyframes ──────────────
  // The title is built from translation keys rather than a static string, so
  // it must be rebuilt whenever the active language changes (see the
  // onLangChange subscription in ngAfterViewInit).
  private buildHeroTitle(): void {
    this.translate.get([
      'hero_title_line1',
      'hero_title_line2_pre',
      'hero_title_line2_gradient',
      'hero_title_line2_post',
    ]).subscribe(t => {
      const PARTS = [
        t['hero_title_line1'], '\n',
        t['hero_title_line2_pre'], t['hero_title_line2_gradient'], t['hero_title_line2_post'],
      ];
      // Line 1: plain text. Line 2: plain prefix + gradient phrase + plain suffix.
      this.renderTitleChars(PARTS, 3);
    });
  }

  private renderTitleChars(parts: string[], gradientPartIdx: number): void {
    const titleEl = document.getElementById('title');
    if (!titleEl) return;

    // Arabic letters join with their neighbours to form connected script —
    // splitting them into one span per character (as the Latin char-reveal
    // does below) breaks that shaping entirely. Reveal whole words instead.
    if (this.translate.currentLang === 'ar') {
      let html = '';
      let delay = 0;
      for (let partIdx = 0; partIdx < parts.length; partIdx++) {
        const part = parts[partIdx];
        if (part === '\n') { html += '<br>'; continue; }
        const cls = partIdx === gradientPartIdx ? 'word gradient' : 'word';
        html += `<span class="${cls}" style="animation-delay:${delay}ms">${part}</span>`;
        delay += 120;
      }
      titleEl.innerHTML = html;
      return;
    }

    let html = '';
    let delay = 0;
    for (let partIdx = 0; partIdx < parts.length; partIdx++) {
      const part = parts[partIdx];
      if (part === '\n') { html += '<br>'; continue; }
      const isGradient = partIdx === gradientPartIdx;
      for (const ch of part) {
        if (ch === ' ') {
          html += `<span class="char" style="animation-delay:${delay}ms">&nbsp;</span>`;
        } else {
          const cls = isGradient ? 'char gradient' : 'char';
          html += `<span class="${cls}" style="animation-delay:${delay}ms">${ch}</span>`;
        }
        delay += 30;
      }
    }
    titleEl.innerHTML = html;
  }

  // ─── Float cards: simple class-add after a delay ─────────────────────────
  private initFloatCards(): void {
    // 800 ms after animations begin feels right; we're already past the
    // double-rAF + setTimeout so subtract that overhead (~120 ms).
    setTimeout(() => {
      document.querySelectorAll<HTMLElement>('.float-card').forEach(c =>
        c.classList.add('show')
      );
    }, 680);
  }

  // ─── Scroll reveal + eval cards ──────────────────────────────────────────
  private initScrollReveal(): void {
    const io = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          // One extra rAF here too: the observer callback itself can fire
          // before the element's initial styles are composited if the page
          // loaded with the element already in the viewport.
          requestAnimationFrame(() => {
            (entry.target as HTMLElement).classList.add('visible');
            // Keep observing eval-cards so the score-bar transition re-runs
            // if the user scrolls away and back.
            if (
              !entry.target.classList.contains('eval-card') &&
              !entry.target.classList.contains('peer-graph')
            ) {
              io.unobserve(entry.target);
            }
          });
        }
      },
      { threshold: 0.15 }
    );

    document.querySelectorAll<HTMLElement>('.reveal, .eval-card').forEach(el =>
      io.observe(el)
    );
    this.observers.push(io);
  }

  // ─── Counters: count-up animation driven by rAF ───────────────────────────
  private initCounters(): void {
    const io = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          const target = +(el.dataset['target'] ?? 0);
          const duration = 1800;
          const start = performance.now();
          const isLarge = target >= 1000;

          const tick = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            el.textContent = isLarge
              ? Math.round(target * eased).toLocaleString()
              : String(Math.round(target * eased));
            if (t < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          io.unobserve(el);
        }
      },
      { threshold: 0.5 }
    );

    document.querySelectorAll<HTMLElement>('[data-target]').forEach(el =>
      io.observe(el)
    );
    this.observers.push(io);
  }

  // ─── Peer graph: cycle active nodes/links every 2.5 s ────────────────────
  private initPeerGraph(): void {
    const linkEls = document.querySelectorAll<HTMLElement>('.peer-graph .link');
    const nodeEls = document.querySelectorAll<HTMLElement>(
      '.peer-graph .node:not(.center)'
    );

    const cycle = () => {
      linkEls.forEach(l => l.classList.remove('active'));
      nodeEls.forEach(n => n.classList.remove('active'));
      const indices = [0, 1, 2, 3, 4, 5].sort(() => Math.random() - 0.5).slice(0, 3);
      indices.forEach(i => {
        linkEls[i]?.classList.add('active');
        nodeEls[i]?.classList.add('active');
      });
    };

    cycle();
    this.intervals.push(setInterval(cycle, 2500));
  }

  // ─── Cursor glow: lerp toward mouse in a private rAF loop ────────────────
  private initCursorGlow(): void {
    const glow = document.getElementById('glow');
    if (!glow) return;

    let glowX = window.innerWidth / 2;
    let glowY = window.innerHeight / 2;
    let targetX = glowX;
    let targetY = glowY;

    const onMove = ((e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    }) as EventListener;
    this.listen(window, 'mousemove', onMove);

    const animate = () => {
      glowX += (targetX - glowX) * 0.08;
      glowY += (targetY - glowY) * 0.08;
      glow.style.left = `${glowX}px`;
      glow.style.top = `${glowY}px`;
      this.rafId = requestAnimationFrame(animate);
    };
    this.rafId = requestAnimationFrame(animate);
  }

  // ─── Nav border on scroll ─────────────────────────────────────────────────
  private initNavScroll(): void {
    const nav = document.getElementById('topnav');
    if (!nav) return;
    const onScroll = (() =>
      nav.classList.toggle('scrolled', window.scrollY > 20)) as EventListener;
    this.listen(window, 'scroll', onScroll, { passive: true } as AddEventListenerOptions);
  }
}