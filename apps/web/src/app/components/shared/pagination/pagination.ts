import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.html',
  styleUrl: './pagination.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
