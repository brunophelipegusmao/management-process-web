import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-container',
  imports: [],
  templateUrl: './container.html',
  styleUrl: './container.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Container {}
