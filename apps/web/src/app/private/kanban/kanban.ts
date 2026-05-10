import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { API_BASE_URL } from '../../core/tokens/api-url.token';

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  processId: string | null;
  cnjNumber: string | null;
  authorName: string | null;
  defendantName: string | null;
  createdByName: string | null;
  updatedByName: string | null;
}

interface SimpleProcess {
  id: string;
  cnjNumber: string;
  authorName: string;
  defendantName: string;
}

@Component({
  selector: 'app-kanban',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './kanban.html',
  styleUrl: './kanban.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Kanban implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = inject(API_BASE_URL);
  private destroyRef = inject(DestroyRef);

  loading = signal(true);
  tasks = signal<Task[]>([]);
  processes = signal<SimpleProcess[]>([]);

  openFormCol = signal<TaskStatus | null>(null);
  submitting = signal(false);
  submitError = signal<string | null>(null);

  draggingId = signal<string | null>(null);
  dragOverCol = signal<TaskStatus | null>(null);

  titleControl = new FormControl('', [Validators.required, Validators.minLength(1)]);
  descriptionControl = new FormControl('');
  processIdControl = new FormControl('');

  todoTasks = computed(() => this.tasks().filter(t => t.status === 'todo'));
  inProgressTasks = computed(() => this.tasks().filter(t => t.status === 'in_progress'));
  doneTasks = computed(() => this.tasks().filter(t => t.status === 'done'));

  readonly columns: { status: TaskStatus; label: string }[] = [
    { status: 'todo', label: 'A FAZER' },
    { status: 'in_progress', label: 'EM ANDAMENTO' },
    { status: 'done', label: 'FEITO' },
  ];

  ngOnInit() {
    forkJoin({
      tasks: this.http.get<{ data: Task[] }>(`${this.apiUrl}/tasks`, { withCredentials: true }),
      processes: this.http.get<{ data: SimpleProcess[]; meta: { total: number } }>(`${this.apiUrl}/processes`, {
        withCredentials: true,
        params: { pageSize: '100' },
      }),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ tasks, processes }) => {
          this.tasks.set(tasks.data);
          this.processes.set(processes.data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  colTasks(status: TaskStatus): Task[] {
    return this.tasks().filter(t => t.status === status);
  }

  openForm(col: TaskStatus) {
    this.openFormCol.set(col);
    this.titleControl.reset('');
    this.descriptionControl.reset('');
    this.processIdControl.reset('');
    this.submitError.set(null);
  }

  cancelForm() {
    this.openFormCol.set(null);
    this.submitError.set(null);
  }

  createTask() {
    if (this.titleControl.invalid || this.submitting()) return;
    const col = this.openFormCol();
    if (!col) return;

    this.submitting.set(true);
    this.submitError.set(null);

    const payload: Record<string, string> = {
      title: this.titleControl.value!.trim(),
      status: col,
    };
    const desc = this.descriptionControl.value?.trim();
    if (desc) payload['description'] = desc;
    const pid = this.processIdControl.value;
    if (pid) payload['processId'] = pid;

    this.http
      .post<Task>(`${this.apiUrl}/tasks`, payload, { withCredentials: true })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.openFormCol.set(null);
          this.refreshTasks();
        },
        error: () => {
          this.submitting.set(false);
          this.submitError.set('Erro ao criar tarefa. Tente novamente.');
        },
      });
  }

  deleteTask(id: string) {
    this.http
      .delete(`${this.apiUrl}/tasks/${id}`, { withCredentials: true })
      .subscribe({
        next: () => this.tasks.update(ts => ts.filter(t => t.id !== id)),
      });
  }

  onDragStart(id: string) {
    this.draggingId.set(id);
  }

  onDragEnd() {
    this.draggingId.set(null);
    this.dragOverCol.set(null);
  }

  onDragOver(event: DragEvent, col: TaskStatus) {
    event.preventDefault();
    this.dragOverCol.set(col);
  }

  onDragLeave() {
    this.dragOverCol.set(null);
  }

  onDrop(event: DragEvent, col: TaskStatus) {
    event.preventDefault();
    this.dragOverCol.set(null);

    const id = this.draggingId();
    if (!id) return;

    const task = this.tasks().find(t => t.id === id);
    if (!task || task.status === col) {
      this.draggingId.set(null);
      return;
    }

    this.tasks.update(ts =>
      ts.map(t => (t.id === id ? { ...t, status: col } : t)),
    );
    this.draggingId.set(null);

    this.http
      .patch(
        `${this.apiUrl}/tasks/${id}/status`,
        { status: col },
        { withCredentials: true },
      )
      .subscribe({
        error: () => {
          this.tasks.update(ts =>
            ts.map(t => (t.id === id ? { ...t, status: task.status } : t)),
          );
        },
      });
  }

  private refreshTasks() {
    this.http
      .get<{ data: Task[] }>(`${this.apiUrl}/tasks`, { withCredentials: true })
      .subscribe({ next: res => this.tasks.set(res.data) });
  }
}
