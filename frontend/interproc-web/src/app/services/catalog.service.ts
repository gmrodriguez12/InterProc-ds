import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface ProcedureType {
  id: string; name: string; icon: string; isArchived: boolean; procedureCount: number; concurrencyToken: string;
}

export interface ProcedureSummary {
  id: string; procedureTypeId: string; procedureTypeName: string; title: string; icon: string;
  shortDescription: string; estimatedMinutes: number | null; currentVersionNumber: number;
  isArchived: boolean; concurrencyToken: string;
}

export interface ProcedureDetail extends ProcedureSummary { steps: string; mermaidDiagram: string | null; }

export interface ProcedureVersion {
  id: string; number: number; steps: string; mermaidDiagram: string | null; reason: string;
  createdAtUtc: string; createdByDisplayName: string; sourceWorkId: string | null; isCurrent: boolean;
}

export interface ProcedureInput {
  procedureTypeId: string; title: string; icon: string; shortDescription: string;
  estimatedMinutes: number | null; steps: string; mermaidDiagram: string | null;
  concurrencyToken?: string; versionReason?: string | null;
}

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);

  listTypes(archived = false): Observable<ProcedureType[]> {
    return this.http.get<ProcedureType[]>('/api/procedure-types', { params: { archived } });
  }
  createType(input: { name: string; icon: string }): Observable<ProcedureType> {
    return this.http.post<ProcedureType>('/api/procedure-types', input);
  }
  updateType(type: ProcedureType): Observable<ProcedureType> {
    return this.http.put<ProcedureType>(`/api/procedure-types/${type.id}`, type);
  }
  archiveType(id: string): Observable<void> { return this.http.post<void>(`/api/procedure-types/${id}/archive`, {}); }
  restoreType(id: string): Observable<void> { return this.http.post<void>(`/api/procedure-types/${id}/restore`, {}); }

  listProcedures(typeId?: string, archived = false, search = ''): Observable<ProcedureSummary[]> {
    let params = new HttpParams().set('archived', archived).set('search', search);
    if (typeId) params = params.set('typeId', typeId);
    return this.http.get<ProcedureSummary[]>('/api/procedures', { params });
  }
  getProcedure(id: string): Observable<ProcedureDetail> { return this.http.get<ProcedureDetail>(`/api/procedures/${id}`); }
  createProcedure(input: ProcedureInput): Observable<ProcedureDetail> { return this.http.post<ProcedureDetail>('/api/procedures', input); }
  updateProcedure(id: string, input: ProcedureInput): Observable<ProcedureDetail> { return this.http.put<ProcedureDetail>(`/api/procedures/${id}`, input); }
  archiveProcedure(id: string): Observable<void> { return this.http.post<void>(`/api/procedures/${id}/archive`, {}); }
  restoreProcedure(id: string): Observable<void> { return this.http.post<void>(`/api/procedures/${id}/restore`, {}); }
  versions(id: string): Observable<ProcedureVersion[]> { return this.http.get<ProcedureVersion[]>(`/api/procedures/${id}/versions`); }
  deleteVersion(procedureId: string, versionId: string): Observable<void> {
    return this.http.delete<void>(`/api/procedures/${procedureId}/versions/${versionId}`);
  }
}
