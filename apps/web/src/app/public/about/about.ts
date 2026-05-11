import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Container } from '../../components/shared/container/container';
import { AboutBanner } from './about-banner/about-banner';
import { Values } from './values/values';

@Component({
  selector: 'app-about',
  imports: [AboutBanner, Container, Values],
  templateUrl: './about.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class About {}
