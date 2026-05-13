import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of, timer } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { API_BASE_URL } from '../../core/tokens/api-url.token';
import { type Deadline, DEADLINE_TYPE_LABELS } from '../../core/models/api.types';

interface UpcomingHearing {
  id: string;
  processId: string;
  cnjNumber: string;
  dateTime: string;
  type: string;
}

interface ProcessResult {
  id: string;
  cnjNumber: string;
  authorName: string;
  defendantName: string;
  status: string;
}

interface ClientResult {
  id: string;
  name: string;
  type: string;
}

type StatusCount = Record<string, number>;

interface Overview {
  emailsSent: number;
  openDeadlines: number;
  overdueDeadlines: number;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done';
  processId: string | null;
  cnjNumber: string | null;
}

const REFRESH_MS = 3 * 60 * 1000;

@Component({
  selector: 'app-dashboard',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = inject(API_BASE_URL);
  private destroyRef = inject(DestroyRef);

  loading = signal(true);
  weekHearings = signal<UpcomingHearing[]>([]);
  monthHearingCount = signal(0);
  witnessByStatus = signal<StatusCount>({});
  emailsSent = signal(0);
  openDeadlineCount = signal(0);
  overdueDeadlineCountKpi = signal(0);
  tasks = signal<Task[]>([]);
  pendingDeadlines = signal<Deadline[]>([]);
  overdueDeadlineList = signal<Deadline[]>([]);

  searchControl = new FormControl('');
  rawQuery = signal('');
  searchLoading = signal(false);
  processResults = signal<ProcessResult[]>([]);
  clientResults = signal<ClientResult[]>([]);
  searchDone = signal(false);

  showSearchPanel = computed(() => this.rawQuery().length >= 2 && this.searchDone());
  hasSearchResults = computed(
    () => this.processResults().length > 0 || this.clientResults().length > 0,
  );

  private readonly PENDING_STATUSES = [
    'pendente_dados',
    'dados_completos',
    'rol_juntado',
    'aguardando_cliente',
  ];
  private readonly DONE_STATUSES = [
    'intimada',
    'intimacao_positiva',
    'intimacao_negativa',
    'desistida',
    'substituida',
  ];

  expedientesAEnviar = computed(() =>
    this.PENDING_STATUSES.reduce((sum, k) => sum + (this.witnessByStatus()[k] ?? 0), 0),
  );
  expedientesEnviados = computed(() =>
    this.DONE_STATUSES.reduce((sum, k) => sum + (this.witnessByStatus()[k] ?? 0), 0),
  );
  weekHearingCount = computed(() => this.weekHearings().length);
  witnessByStatusEntries = computed(() =>
    Object.entries(this.witnessByStatus()).sort((a, b) => b[1] - a[1]),
  );
  witnessTotal = computed(() => Object.values(this.witnessByStatus()).reduce((s, n) => s + n, 0));

  todoTasks = computed(() =>
    this.tasks()
      .filter((t) => t.status === 'todo')
      .slice(0, 5),
  );
  inProgressTasks = computed(() =>
    this.tasks()
      .filter((t) => t.status === 'in_progress')
      .slice(0, 5),
  );
  activeTaskCount = computed(
    () => this.tasks().filter((t) => t.status === 'todo' || t.status === 'in_progress').length,
  );

  todayHearingCount = computed(() => {
    const today = new Date().toDateString();
    return this.weekHearings().filter((h) => new Date(h.dateTime).toDateString() === today).length;
  });

  todayDeadlineCount = computed(() => {
    const today = new Date().toISOString().slice(0, 10);
    return [...this.overdueDeadlineList(), ...this.pendingDeadlines()].filter(
      (d) => d.dueDate === today,
    ).length;
  });

  readonly deadlineTypeLabels = DEADLINE_TYPE_LABELS;

  readonly witnessLabels: Partial<Record<string, string>> = {
    pendente_dados: 'Pendente de dados',
    dados_completos: 'Dados completos',
    rol_juntado: 'Rol juntado',
    intimada: 'Intimada',
    intimacao_positiva: 'Intimação positiva',
    intimacao_negativa: 'Intimação negativa',
    aguardando_cliente: 'Aguardando cliente',
    desistida: 'Desistida',
    substituida: 'Substituída',
  };

  readonly warningStatuses = new Set([
    'pendente_dados',
    'intimacao_negativa',
    'aguardando_cliente',
  ]);

  ngOnInit() {
    this.loadDashboardData();

    // Auto-refresh a cada 3 minutos
    timer(REFRESH_MS, REFRESH_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadDashboardData());

    const changes$ = this.searchControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef));

    changes$.subscribe((v) => this.rawQuery.set(v ?? ''));

    changes$.pipe(debounceTime(400), distinctUntilChanged()).subscribe((query) => {
      if (!query || query.length < 2) {
        this.processResults.set([]);
        this.clientResults.set([]);
        this.searchDone.set(false);
        return;
      }
      this.searchLoading.set(true);
      forkJoin({
        processes: this.http.get<{ data: ProcessResult[] }>(`${this.apiUrl}/processes`, {
          withCredentials: true,
          params: { cnjNumber: query, pageSize: '5' },
        }),
        clients: this.http.get<{ data: ClientResult[] }>(`${this.apiUrl}/clients`, {
          withCredentials: true,
          params: { name: query, pageSize: '3' },
        }),
      }).subscribe({
        next: ({ processes, clients }) => {
          this.processResults.set(processes.data);
          this.clientResults.set(clients.data);
          this.searchLoading.set(false);
          this.searchDone.set(true);
        },
        error: () => {
          this.searchLoading.set(false);
          this.searchDone.set(true);
        },
      });
    });
  }

  private loadDashboardData() {
    const now = new Date();
    const { weekStart, weekEnd } = this.getWeekRange(now);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    forkJoin({
      upcoming: this.http
        .get<{
          data: UpcomingHearing[];
        }>(`${this.apiUrl}/reports/upcoming-hearings`, { withCredentials: true })
        .pipe(catchError(() => of({ data: [] as UpcomingHearing[] }))),
      monthHearings: this.http
        .get<{ data: unknown[]; meta: { total: number } }>(`${this.apiUrl}/hearings`, {
          withCredentials: true,
          params: {
            startsAt: monthStart.toISOString(),
            endsAt: monthEnd.toISOString(),
            pageSize: '1',
          },
        })
        .pipe(catchError(() => of({ data: [], meta: { total: 0 } }))),
      witnesses: this.http
        .get<{
          data: StatusCount;
        }>(`${this.apiUrl}/reports/witnesses-by-status`, { withCredentials: true })
        .pipe(catchError(() => of({ data: {} as StatusCount }))),
      overview: this.http
        .get<{ data: Overview }>(`${this.apiUrl}/reports/overview`, { withCredentials: true })
        .pipe(
          catchError(() => of({ data: { emailsSent: 0, openDeadlines: 0, overdueDeadlines: 0 } })),
        ),
      tasks: this.http
        .get<{ data: Task[] }>(`${this.apiUrl}/tasks`, { withCredentials: true })
        .pipe(catchError(() => of({ data: [] as Task[] }))),
      openDeadlines: this.http
        .get<{
          data: Deadline[];
        }>(`${this.apiUrl}/deadlines`, { withCredentials: true, params: { status: 'aberto', pageSize: '7' } })
        .pipe(catchError(() => of({ data: [] as Deadline[] }))),
      overdueDeadlines: this.http
        .get<{
          data: Deadline[];
        }>(`${this.apiUrl}/deadlines`, { withCredentials: true, params: { status: 'vencido', pageSize: '5' } })
        .pipe(catchError(() => of({ data: [] as Deadline[] }))),
    }).subscribe({
      next: ({
        upcoming,
        monthHearings,
        witnesses,
        overview,
        tasks,
        openDeadlines,
        overdueDeadlines,
      }) => {
        this.weekHearings.set(
          upcoming.data.filter((h) => {
            const d = new Date(h.dateTime);
            return d >= weekStart && d <= weekEnd;
          }),
        );
        this.monthHearingCount.set(monthHearings.meta?.total ?? 0);
        this.witnessByStatus.set(witnesses.data);
        this.emailsSent.set(overview.data?.emailsSent ?? 0);
        this.openDeadlineCount.set(overview.data?.openDeadlines ?? 0);
        this.overdueDeadlineCountKpi.set(overview.data?.overdueDeadlines ?? 0);
        this.tasks.set(tasks.data);
        this.pendingDeadlines.set(openDeadlines.data);
        this.overdueDeadlineList.set(overdueDeadlines.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  clearSearch() {
    this.searchControl.setValue('');
    this.processResults.set([]);
    this.clientResults.set([]);
    this.searchDone.set(false);
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

  formatDateTime(dt: string): { date: string; time: string } {
    const d = new Date(dt);
    return {
      date: d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }),
      time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
  }

  barWidth(count: number, total: number): string {
    return total === 0 ? '0%' : `${Math.round((count / total) * 100)}%`;
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  isOverdue(dueDate: string): boolean {
    return dueDate < new Date().toISOString().slice(0, 10);
  }

  isDueToday(dueDate: string): boolean {
    return dueDate === new Date().toISOString().slice(0, 10);
  }

  private getWeekRange(now: Date): { weekStart: Date; weekEnd: Date } {
    const day = now.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + diffToMonday);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return { weekStart, weekEnd };
  }
}
