import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface ManagedUser {
  id: string;
  displayName: string;
  username: string;
  email: string;
  role: 'admin' | 'usuario';
  isActive: boolean;
  mustChangePassword: boolean;
}

export interface CreateManagedUser {
  displayName: string;
  username: string;
  email: string;
  role: 'admin' | 'usuario';
  temporaryPassword: string;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);

  list(): Observable<ManagedUser[]> {
    return this.http.get<ManagedUser[]>('/api/users');
  }

  create(user: CreateManagedUser): Observable<ManagedUser> {
    return this.http.post<ManagedUser>('/api/users', user);
  }

  update(user: ManagedUser): Observable<ManagedUser> {
    return this.http.put<ManagedUser>(`/api/users/${user.id}`, user);
  }

  resetPassword(id: string, temporaryPassword: string): Observable<void> {
    return this.http.post<void>(`/api/users/${id}/temporary-password`, { temporaryPassword });
  }
}
