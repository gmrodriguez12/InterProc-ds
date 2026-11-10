import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';

interface AuditEvent { id: number; action: string; entityType: string; entityLabel: string; userDisplayName: string; occurredAtUtc: string; }

@Component({
  selector: 'app-audit', standalone: true,
  template: `
    <section class="page">
      <div class="page__head"><div><span class="eyebrow">Administración</span><h1>Auditoría de archivo</h1><p>Registro mínimo de archivados y restauraciones.</p></div></div>
      <div class="table-wrap"><table>
        <thead><tr><th>Fecha</th><th>Acción</th><th>Tipo</th><th>Elemento</th><th>Usuario</th></tr></thead>
        <tbody>@for (event of events; track event.id) {<tr><td class="mono">{{ event.occurredAtUtc }}</td><td><span class="badge">{{ event.action }}</span></td><td>{{ event.entityType }}</td><td>{{ event.entityLabel }}</td><td>{{ event.userDisplayName }}</td></tr>} @empty {<tr><td class="table-empty" colspan="5">Todavía no hay eventos de archivo.</td></tr>}</tbody>
      </table></div>
    </section>
  `,
})
export class AuditComponent implements OnInit {
  private readonly http = inject(HttpClient);
  events: AuditEvent[] = [];
  async ngOnInit(): Promise<void> { this.events = await firstValueFrom(this.http.get<AuditEvent[]>('/api/audit')); }
}
