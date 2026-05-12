import { Injectable, computed, signal } from '@angular/core';
import type { Client } from '../models/api.types';

interface ClientListState {
  items: Client[];
  total: number;
  page: number;
  pageSize: number;
  filters: Record<string, string>;
  cachedAt: number;
}

const TTL_MS = 2 * 60 * 1000; // 2 minutes

@Injectable({ providedIn: 'root' })
export class ClientStore {
  private readonly _state = signal<ClientListState | null>(null);

  readonly state = this._state.asReadonly();

  readonly isFresh = computed(() => {
    const s = this._state();
    return s !== null && Date.now() - s.cachedAt < TTL_MS;
  });

  set(state: Omit<ClientListState, 'cachedAt'>): void {
    this._state.set({ ...state, cachedAt: Date.now() });
  }

  invalidate(): void {
    this._state.set(null);
  }
}
