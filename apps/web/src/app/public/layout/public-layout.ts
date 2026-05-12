import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from '../../components/shared/footer/footer';
import { Header } from '../../components/shared/header/header';

@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, Header, Footer],
  templateUrl: './public-layout.html',
  styleUrl: './public-layout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'light' },
})
export class PublicLayout {}
