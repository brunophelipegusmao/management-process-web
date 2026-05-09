import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-contact-banner',
  imports: [],
  templateUrl: './contact-banner.html',
  styleUrl: './contact-banner.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactBanner {}
