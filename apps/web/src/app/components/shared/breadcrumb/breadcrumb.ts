import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BreadcrumbService, type BreadcrumbItem } from '../../../core/services/breadcrumb.service';

@Component({
  selector: 'app-breadcrumb',
  imports: [RouterLink],
  templateUrl: './breadcrumb.html',
  styleUrl: './breadcrumb.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Breadcrumb {
  private readonly svc = inject(BreadcrumbService);
  readonly crumbs = this.svc.crumbs as () => BreadcrumbItem[];
}
