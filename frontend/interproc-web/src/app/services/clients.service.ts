import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface ClientSummary {
  id: string; name: string; taxId: string | null; contactPerson: string | null; email: string | null;
  workCount: number; openWorkCount: number; isArchived: boolean; concurrencyToken: string;
}
export interface WorkSummary { id: string; name: string; code: string; state: string; progressPercent: number; isArchived: boolean; }
export interface ClientNote {
  id: string; workItemId: string | null; workCode: string | null; text: string; createdAtUtc: string;
  createdByDisplayName: string; updatedAtUtc: string | null; updatedByDisplayName: string | null; concurrencyToken: string;
}
export interface ClientDetail {
  id: string; name: string; taxId: string | null; contactPerson: string | null; email: string | null;
  phone: string | null; address: string | null; isArchived: boolean; concurrencyToken: string;
  works: WorkSummary[]; notes: ClientNote[];
}
export interface ClientInput {
  name: string; taxId: string | null; contactPerson: string | null; email: string | null;
  phone: string | null; address: string | null; concurrencyToken?: string;
}

@Injectable({ providedIn: 'root' })
export class ClientsService {
  private readonly http = inject(HttpClient);
  list(archived = false): Observable<ClientSummary[]> { return this.http.get<ClientSummary[]>('/api/clients', { params: { archived } }); }
  get(id: string): Observable<ClientDetail> { return this.http.get<ClientDetail>(`/api/clients/${id}`); }
  create(input: ClientInput): Observable<ClientDetail> { return this.http.post<ClientDetail>('/api/clients', input); }
  update(id: string, input: ClientInput): Observable<ClientDetail> { return this.http.put<ClientDetail>(`/api/clients/${id}`, input); }
  archive(id: string): Observable<void> { return this.http.post<void>(`/api/clients/${id}/archive`, {}); }
  restore(id: string): Observable<void> { return this.http.post<void>(`/api/clients/${id}/restore`, {}); }
  addNote(clientId: string, input: { text: string; workItemId: string | null }): Observable<ClientNote> {
    return this.http.post<ClientNote>(`/api/clients/${clientId}/notes`, input);
  }
  updateNote(clientId: string, note: ClientNote): Observable<ClientNote> {
    return this.http.put<ClientNote>(`/api/clients/${clientId}/notes/${note.id}`, {
      text: note.text, workItemId: note.workItemId, concurrencyToken: note.concurrencyToken,
    });
  }
}
