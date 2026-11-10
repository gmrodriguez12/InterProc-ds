import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Account {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'usuario';
  isActive: boolean;
  mustChangePassword: boolean;
}

export interface CreateAccount {
  username: string;
  email: string;
  temporaryPassword: string;
  role: 'admin' | 'usuario';
}

@Injectable({ providedIn: 'root' })
export class AccountsService {
  private readonly http = inject(HttpClient);

  list(): Observable<Account[]> {
    return this.http.get<Account[]>('/api/accounts', { withCredentials: true });
  }

  create(account: CreateAccount): Observable<Account> {
    return this.http.post<Account>('/api/accounts', account, { withCredentials: true });
  }

  setActive(id: string, isActive: boolean): Observable<Account> {
    return this.http.patch<Account>(
      `/api/accounts/${encodeURIComponent(id)}/active`,
      { isActive },
      { withCredentials: true },
    );
  }
}
