import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Home } from './public/home/home';
import { Header } from './components/shared/header/header';

@Component({
  selector: 'app-root',
  imports: [Home, Header],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
