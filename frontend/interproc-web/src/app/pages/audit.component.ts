import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';

interface AuditEvent { id: number; action: string; entityType: string; entityLabel: string; userDisplayName: string; occurredAtUtc: string; }

@Component({
  selector: 'app-audit', standalone: true,
  template: `
    <section class="resource-page">
      <div class="page-heading"><div><p class="eyebrow">ADMINISTRATION</p><h1>Archive audit</h1></div></div>
      <div class="panel table-wrap"><table>
        <thead><tr><th>Date</th><th>Action</th><th>Type</th><th>Item</th><th>User</th></tr></thead>
        <tbody>@for (event of events; track event.id) {<tr><td>{{ event.occurredAtUtc }}</td><td>{{ event.action }}</td><td>{{ event.entityType }}</td><td>{{ event.entityLabel }}</td><td>{{ event.userDisplayName }}</td></tr>} @empty {<tr><td colspan="5">No archive events yet.</td></tr>}</tbody>
      </table></div>
    </section>
  `,
})
export class AuditComponent implements OnInit {
  private readonly http = inject(HttpClient);
  events: AuditEvent[] = [];
  async ngOnInit(): Promise<void> { this.events = await firstValueFrom(this.http.get<AuditEvent[]>('/api/audit')); }
}
