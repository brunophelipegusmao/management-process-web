import { Injectable, signal } from '@angular/core';

export interface BreadcrumbItem {
  label: string;
  /** Absolute path for the link. `null` = current page (no link). */
  path: string | null;
}

@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  private readonly _crumbs = signal<BreadcrumbItem[]>([]);
  readonly crumbs = this._crumbs.asReadonly();

  set(crumbs: BreadcrumbItem[]): void {
    this._crumbs.set(crumbs);
  }

  clear(): void {
    this._crumbs.set([]);
  }
}
