import { Component, inject, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { CatalogService } from '../services/catalog.service';
import { ClientsService } from '../services/clients.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <section class="page">
      <div class="page__head">
        <div>
          <span class="eyebrow">Dashboard</span>
          <h1>Resumen de InterProc</h1>
          <p>Estado actual del catálogo y las relaciones con clientes.</p>
        </div>
      </div>

      <div class="stats" aria-label="Indicadores">
        <article class="stat"><div class="stat__head"><span class="stat__label">Trabajos activos</span><i class="fa-solid fa-briefcase" aria-hidden="true"></i></div><span class="stat__value">{{ activeWorkCount }}</span><span class="stat__hint">Fundación de trabajos</span></article>
        <article class="stat"><div class="stat__head"><span class="stat__label">Procedimientos</span><i class="fa-solid fa-book" aria-hidden="true"></i></div><span class="stat__value">{{ procedureCount }}</span><span class="stat__hint">{{ typeCount }} tipos activos</span></article>
        <article class="stat"><div class="stat__head"><span class="stat__label">Clientes</span><i class="fa-solid fa-building" aria-hidden="true"></i></div><span class="stat__value">{{ clientCount }}</span><span class="stat__hint">Clientes activos</span></article>
      </div>

      <article class="card dashboard-placeholder">
        <div>
          <i class="fa-solid fa-table-columns" aria-hidden="true"></i>
          <h2>El tablero de trabajos llegará en una próxima fase</h2>
          <p>Por ahora podés administrar el catálogo de procedimientos y los clientes desde el menú lateral.</p>
        </div>
      </article>

      @if (loadError) {
        <div class="alert alert--warn" role="status"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i><p>No se pudieron actualizar algunos indicadores.</p></div>
      }
    </section>
  `,
})
export class DashboardComponent implements OnInit {
  private readonly catalog = inject(CatalogService);
  private readonly clients = inject(ClientsService);

  activeWorkCount = 0;
  procedureCount = 0;
  typeCount = 0;
  clientCount = 0;
  loadError = false;

  async ngOnInit(): Promise<void> {
    try {
      const [types, procedures, clients] = await Promise.all([
        firstValueFrom(this.catalog.listTypes()),
        firstValueFrom(this.catalog.listProcedures()),
        firstValueFrom(this.clients.list()),
      ]);
      this.typeCount = types.length;
      this.procedureCount = procedures.length;
      this.clientCount = clients.length;
      this.activeWorkCount = clients.reduce((total, client) => total + client.openWorkCount, 0);
    } catch {
      this.loadError = true;
    }
  }
}
