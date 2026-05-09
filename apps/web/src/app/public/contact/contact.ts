import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Container } from '../../components/shared/container/container';
import { ContactBanner } from './contact-banner/contact-banner';
import { ContactForm } from './contact-form/contact-form';

@Component({
  selector: 'app-contact',
  imports: [ContactBanner, Container, ContactForm],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Contact {}
