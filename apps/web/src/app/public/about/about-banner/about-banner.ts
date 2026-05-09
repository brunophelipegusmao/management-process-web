import { ChangeDetectionStrategy, Component, ElementRef, inject, OnInit, signal } from '@angular/core';

@Component({
  selector: 'app-about-banner',
  imports: [],
  templateUrl: './about-banner.html',
  styleUrl: './about-banner.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutBanner implements OnInit {
  private el = inject(ElementRef);
  readonly visible = signal(false);

  ngOnInit() {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          this.visible.set(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(this.el.nativeElement);
  }
}
