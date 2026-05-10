import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { API_BASE_URL } from '../../core/tokens/api-url.token';

interface Overview {
  processesTotal: number;
  hearingsScheduled: number;
  openDeadlines: number;
  overdueDeadlines: number;
  pendingWitnessData: number;
  emailsSent: number;
}

type StatusCount = Record<string, number>;

interface KpiCard {
  label: string;
  value: number;
  warn: boolean;
}

@Component({
  selector: 'app-reports',
  imports: [RouterLink],
  templateUrl: './reports.html',
  styleUrl: './reports.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Reports implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = inject(API_BASE_URL);

  loading = signal(true);
  kpiCards = signal<KpiCard[]>([]);
  deadlinesByStatus = signal<StatusCount>({});
  witnessesByStatus = signal<StatusCount>({});

  readonly deadlineLabels: Partial<Record<string, string>> = {
    aberto: 'Aberto',
    vencido: 'Vencido',
    cumprido: 'Cumprido',
    cancelado: 'Cancelado',
  };

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

  readonly warnDeadlineStatuses = new Set(['vencido']);
  readonly warnWitnessStatuses = new Set(['intimacao_negativa', 'aguardando_cliente']);

  ngOnInit() {
    forkJoin({
      overview: this.http.get<{ data: Overview }>(`${this.apiUrl}/reports/overview`, { withCredentials: true }),
      deadlines: this.http.get<{ data: StatusCount }>(`${this.apiUrl}/reports/deadlines-by-status`, { withCredentials: true }),
      witnesses: this.http.get<{ data: StatusCount }>(`${this.apiUrl}/reports/witnesses-by-status`, { withCredentials: true }),
    }).subscribe({
      next: ({ overview, deadlines, witnesses }) => {
        const o = overview.data;
        this.kpiCards.set([
          { label: 'Processos', value: o.processesTotal, warn: false },
          { label: 'Audiências agendadas', value: o.hearingsScheduled, warn: false },
          { label: 'Prazos em aberto', value: o.openDeadlines, warn: false },
          { label: 'Prazos vencidos', value: o.overdueDeadlines, warn: o.overdueDeadlines > 0 },
          { label: 'Testemunhas s/ dados', value: o.pendingWitnessData, warn: o.pendingWitnessData > 0 },
          { label: 'E-mails enviados', value: o.emailsSent, warn: false },
        ]);
        this.deadlinesByStatus.set(deadlines.data);
        this.witnessesByStatus.set(witnesses.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  entries(obj: StatusCount): [string, number][] {
    return Object.entries(obj).sort((a, b) => b[1] - a[1]);
  }

  total(obj: StatusCount): number {
    return Object.values(obj).reduce((sum, n) => sum + n, 0);
  }

  barWidth(count: number, obj: StatusCount): string {
    const t = this.total(obj);
    return t === 0 ? '0%' : `${Math.round((count / t) * 100)}%`;
  }
}
