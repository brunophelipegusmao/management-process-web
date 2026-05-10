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
import { forkJoin } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { API_BASE_URL } from '../../core/tokens/api-url.token';

interface Process {
  id: string;
  cnjNumber: string;
  authorName: string;
  defendantName: string;
  status: string;
  comarca: string;
  vara: string;
  courtType: string;
  clientSide: string;
}

interface ClientResult {
  id: string;
  name: string;
  type: string;
}

interface ProcessGroup {
  clientName?: string;
  clientType?: string;
  processes: Process[];
}

type SearchMode = 'cnj' | 'nome';

@Component({
  selector: 'app-consulta',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './consulta.html',
  styleUrl: './consulta.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Consulta implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = inject(API_BASE_URL);
  private destroyRef = inject(DestroyRef);

  searchControl = new FormControl('');
  rawQuery = signal('');
  searchMode = signal<SearchMode>('cnj');
  searchLoading = signal(false);
  searchDone = signal(false);
  groups = signal<ProcessGroup[]>([]);

  private searchId = 0;

  hasResults = computed(() => this.groups().some(g => g.processes.length > 0));
  totalResults = computed(() => this.groups().reduce((s, g) => s + g.processes.length, 0));

  ngOnInit() {
    const changes$ = this.searchControl.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    );

    changes$.subscribe(v => this.rawQuery.set(v ?? ''));

    changes$.pipe(debounceTime(450)).subscribe(query => {
      this.performSearch(query ?? '');
    });
  }

  setMode(mode: SearchMode) {
    this.searchMode.set(mode);
    const q = this.rawQuery();
    if (q.length >= 2) {
      this.performSearch(q);
    } else {
      this.groups.set([]);
      this.searchDone.set(false);
    }
  }

  clearSearch() {
    this.searchControl.setValue('');
    this.groups.set([]);
    this.searchDone.set(false);
  }

  private performSearch(query: string) {
    if (query.length < 2) {
      this.groups.set([]);
      this.searchDone.set(false);
      return;
    }

    const id = ++this.searchId;
    this.searchLoading.set(true);
    this.searchDone.set(false);

    if (this.searchMode() === 'cnj') {
      this.http
        .get<{ data: Process[] }>(`${this.apiUrl}/processes`, {
          withCredentials: true,
          params: { cnjNumber: query, pageSize: '10' },
        })
        .subscribe({
          next: res => {
            if (id !== this.searchId) return;
            this.groups.set([{ processes: res.data }]);
            this.searchLoading.set(false);
            this.searchDone.set(true);
          },
          error: () => {
            if (id !== this.searchId) return;
            this.searchLoading.set(false);
            this.searchDone.set(true);
          },
        });
    } else {
      this.http
        .get<{ data: ClientResult[] }>(`${this.apiUrl}/clients`, {
          withCredentials: true,
          params: { name: query, pageSize: '4' },
        })
        .subscribe({
          next: clients => {
            if (id !== this.searchId) return;
            if (clients.data.length === 0) {
              this.groups.set([]);
              this.searchLoading.set(false);
              this.searchDone.set(true);
              return;
            }
            forkJoin(
              clients.data.map(c =>
                this.http.get<{ data: Process[] }>(`${this.apiUrl}/processes`, {
                  withCredentials: true,
                  params: { clientId: c.id, pageSize: '5' },
                }),
              ),
            ).subscribe({
              next: results => {
                if (id !== this.searchId) return;
                const mapped = clients.data.map((c, i) => ({
                  clientName: c.name,
                  clientType: c.type,
                  processes: results[i].data,
                }));
                this.groups.set(mapped.filter(g => g.processes.length > 0));
                this.searchLoading.set(false);
                this.searchDone.set(true);
              },
              error: () => {
                if (id !== this.searchId) return;
                this.searchLoading.set(false);
                this.searchDone.set(true);
              },
            });
          },
          error: () => {
            if (id !== this.searchId) return;
            this.searchLoading.set(false);
            this.searchDone.set(true);
          },
        });
    }
  }

  statusConfig(status: string): { label: string; cls: string } {
    const map: Record<string, { label: string; cls: string }> = {
      citado: { label: 'Citado', cls: 'text-mulim-ouro border-mulim-ouro/40' },
      em_andamento: { label: 'Em andamento', cls: 'text-green-500 dark:text-green-400 border-green-500/40' },
      encerrado: { label: 'Encerrado', cls: 'text-foreground/30 border-foreground/15' },
    };
    return map[status] ?? { label: status, cls: 'text-foreground/30 border-foreground/15' };
  }

  courtTypeLabel(ct: string): string {
    return ct === 'jec' ? 'JEC' : 'Vara Comum';
  }

  clientSideLabel(cs: string): string {
    return cs === 'autor' ? 'Autor' : 'Réu';
  }
}
