import { ChangeDetectionStrategy, Component, ElementRef, inject, OnInit, signal } from '@angular/core';

@Component({
  selector: 'app-values',
  imports: [],
  templateUrl: './values.html',
  styleUrl: './values.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Values implements OnInit {
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
      { threshold: 0.15 },
    );
    observer.observe(this.el.nativeElement);
  }
}
