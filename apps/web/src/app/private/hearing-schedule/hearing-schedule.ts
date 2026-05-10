import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { API_BASE_URL } from '../../core/tokens/api-url.token';

export type ViewMode = 'month' | 'agenda';

export interface UpcomingHearing {
  id: string;
  processId: string;
  cnjNumber: string;
  authorName: string;
  defendantName: string;
  clientSide: string;
  dateTime: string;
  type: string;
  status: string;
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  dateKey: string;
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
  private destroyRef = inject(DestroyRef);
  private loadId = 0;

  hearings = signal<UpcomingHearing[]>([]);
  loading = signal(true);
  view = signal<ViewMode>('month');
  currentDate = signal(new Date());
  filterType = signal('');

  readonly weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  readonly typeOptions = [
    { value: '', label: 'Todos' },
    { value: 'conciliacao', label: 'Conciliação' },
    { value: 'aij', label: 'AIJ' },
    { value: 'oitiva', label: 'Oitiva' },
    { value: 'acij', label: 'ACIJ' },
  ];

  readonly typeLabels: Partial<Record<string, string>> = {
    conciliacao: 'Conciliação',
    aij: 'AIJ',
    oitiva: 'Oitiva',
    acij: 'ACIJ',
  };

  monthTitle = computed(() =>
    this.currentDate().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
  );

  calendarDays = computed<CalendarDay[]>(() => {
    const ref = this.currentDate();
    const year = ref.getFullYear();
    const month = ref.getMonth();
    const today = new Date();
    const todayKey = this.toDateKey(today);

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: CalendarDay[] = [];

    for (let i = firstDay.getDay() - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, isCurrentMonth: false, isToday: false, dateKey: this.toDateKey(d) });
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const dateKey = this.toDateKey(date);
      days.push({ date, isCurrentMonth: true, isToday: dateKey === todayKey, dateKey });
    }
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const date = new Date(year, month + 1, d);
      days.push({ date, isCurrentMonth: false, isToday: false, dateKey: this.toDateKey(date) });
    }
    return days;
  });

  hearingsByDate = computed(() => {
    const map = new Map<string, UpcomingHearing[]>();
    for (const h of this.hearings()) {
      const key = h.dateTime.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(h);
    }
    return map;
  });

  grouped = computed(() => {
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
    this.load();
  }

  prevMonth() {
    const d = this.currentDate();
    this.currentDate.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
    this.load();
  }

  nextMonth() {
    const d = this.currentDate();
    this.currentDate.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
    this.load();
  }

  goToday() {
    this.currentDate.set(new Date());
    this.load();
  }

  setView(v: ViewMode) { this.view.set(v); }
  setFilter(v: string) { this.filterType.set(v); }

  getHearingsForDay(dateKey: string): UpcomingHearing[] {
    return this.hearingsByDate().get(dateKey) ?? [];
  }

  opposingParty(h: UpcomingHearing): string {
    return h.clientSide === 'autor' ? h.defendantName : h.authorName;
  }

  typeLabel(type: string): string {
    return this.typeLabels[type] ?? type;
  }

  formatTime(dt: string): string {
    return new Date(dt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  private load() {
    const id = ++this.loadId;
    const ref = this.currentDate();
    const year = ref.getFullYear();
    const month = ref.getMonth();
    const from = new Date(year, month, 1).toISOString();
    const to = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

    this.loading.set(true);
    this.http
      .get<{ data: UpcomingHearing[] }>(`${this.apiUrl}/reports/upcoming-hearings`, {
        withCredentials: true,
        params: { from, to },
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          if (id !== this.loadId) return;
          this.hearings.set(res.data);
          this.loading.set(false);
        },
        error: () => {
          if (id !== this.loadId) return;
          this.loading.set(false);
        },
      });
  }

  toDateKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private formatDateLabel(key: string): string {
    const [year, month, day] = key.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }
}
