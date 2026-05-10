import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (totalPages() > 1) {
      <nav aria-label="Paginação" class="flex items-center justify-between gap-4 py-4">
        <p class="font-mono text-xs text-foreground/40">
          {{ (page() - 1) * pageSize() + 1 }}–{{ Math.min(page() * pageSize(), total()) }} de {{ total() }}
        </p>

        <div class="flex items-center gap-1">
          <button
            (click)="pageChange.emit(page() - 1)"
            [disabled]="page() === 1"
            aria-label="Página anterior"
            class="px-3 py-1.5 font-mono text-xs border border-foreground/15 hover:border-foreground/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:outline-2 focus-visible:outline-mulim-ouro focus-visible:outline-offset-1"
          >
            ←
          </button>

          @for (p of pages(); track p) {
            @if (p === -1) {
              <span class="px-2 font-mono text-xs text-foreground/30">…</span>
            } @else {
              <button
                (click)="pageChange.emit(p)"
                [attr.aria-label]="'Página ' + p"
                [attr.aria-current]="p === page() ? 'page' : null"
                class="min-w-[2rem] px-2 py-1.5 font-mono text-xs border transition-colors focus-visible:outline-2 focus-visible:outline-mulim-ouro focus-visible:outline-offset-1"
                [class.border-mulim-ouro]="p === page()"
                [class.text-mulim-ouro]="p === page()"
                [class.border-foreground/15]="p !== page()"
                [class.hover:border-foreground/30]="p !== page()"
              >
                {{ p }}
              </button>
            }
          }

          <button
            (click)="pageChange.emit(page() + 1)"
            [disabled]="page() === totalPages()"
            aria-label="Próxima página"
            class="px-3 py-1.5 font-mono text-xs border border-foreground/15 hover:border-foreground/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:outline-2 focus-visible:outline-mulim-ouro focus-visible:outline-offset-1"
          >
            →
          </button>
        </div>
      </nav>
    }
  `,
})
export class Pagination {
  readonly total = input.required<number>();
  readonly page = input.required<number>();
  readonly pageSize = input.required<number>();

  readonly pageChange = output<number>();

  protected readonly Math = Math;

  readonly totalPages = computed(() => Math.ceil(this.total() / this.pageSize()));

  readonly pages = computed(() => {
    const total = this.totalPages();
    const current = this.page();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const result: number[] = [1];
    if (current > 3) result.push(-1);
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      result.push(i);
    }
    if (current < total - 2) result.push(-1);
    result.push(total);
    return result;
  });
}
