import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Container } from '../../components/shared/container/container';
import { Hero } from './hero/hero';
import { TextSection } from './text-section/text-section';

@Component({
  selector: 'app-home',
  imports: [Hero, Container, TextSection],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {}
