import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { API_BASE_URL } from '../../core/tokens/api-url.token';

interface UpcomingHearing {
  id: string;
  processId: string;
  cnjNumber: string;
  dateTime: string;
  type: string;
}

interface HearingGroup {
  dateKey: string;
  dateLabel: string;
  hearings: UpcomingHearing[];
}

@Component({
  selector: 'app-hearing-schedule',
  imports: [RouterLink],
  templateUrl: './hearing-schedule.html',
  styleUrl: './hearing-schedule.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HearingSchedule implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = inject(API_BASE_URL);

  hearings = signal<UpcomingHearing[]>([]);
  loading = signal(true);
  filterType = signal('');

  readonly typeOptions = [
    { value: '', label: 'Todos' },
    { value: 'conciliacao', label: 'Conciliação' },
    { value: 'aij', label: 'AIJ' },
    { value: 'oitiva', label: 'Oitiva' },
    { value: 'acij', label: 'ACIJ' },
  ];

  grouped = computed<HearingGroup[]>(() => {
    const list = this.filterType()
      ? this.hearings().filter(h => h.type === this.filterType())
      : this.hearings();

    const map = new Map<string, UpcomingHearing[]>();
    for (const h of list) {
      const key = h.dateTime.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(h);
    }

    return Array.from(map.entries()).map(([key, items]) => ({
      dateKey: key,
      dateLabel: this.formatDateLabel(key),
      hearings: items,
    }));
  });

  ngOnInit() {
    this.http
      .get<{ data: UpcomingHearing[] }>(`${this.apiUrl}/reports/upcoming-hearings`, { withCredentials: true })
      .subscribe({
        next: (res) => {
          this.hearings.set(res.data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  setFilter(value: string) {
    this.filterType.set(value);
  }

  typeLabel(type: string): string {
    const map: Record<string, string> = {
      conciliacao: 'Conciliação',
      aij: 'AIJ',
      oitiva: 'Oitiva',
      acij: 'ACIJ',
    };
    return map[type] ?? type;
  }

  formatTime(dt: string): string {
    return new Date(dt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  private formatDateLabel(key: string): string {
    const [year, month, day] = key.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }
}
