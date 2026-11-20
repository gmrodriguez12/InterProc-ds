import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { PendingChangesComponent } from '../guards/pending-changes.guard';
import { AuthService } from '../services/auth.service';
import { ClientDetail, ClientNote, ClientsService, ClientSummary } from '../services/clients.service';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  template: `
    <section class="page">
      <div class="page__head">
        <div><span class="eyebrow">Relaciones</span><h1>Clientes</h1><p>Personas y empresas vinculadas a los trabajos.</p></div>
        <div class="page__actions"><button class="btn btn--primary" type="button" (click)="startNew()"><i class="fa-solid fa-plus" aria-hidden="true"></i>Nuevo cliente</button></div>
      </div>
      @if (message) { <div class="alert" role="status"><i class="fa-solid fa-circle-info" aria-hidden="true"></i><p>{{ message }}</p></div> }
      <div class="toolbar">
        <div class="field toolbar__search"><label for="client-search">Buscar cliente</label><input id="client-search" [(ngModel)]="search" placeholder="Nombre, RUT, contacto o email"></div>
        <label class="toggle"><input type="checkbox" [(ngModel)]="showArchived" (change)="loadClients()"> Mostrar archivados</label>
      </div>

      <div class="client-layout" [class.with-editor]="showEditor">
        <div class="table-wrap">
          <table><thead><tr><th>Cliente</th><th>RUT / ID</th><th>Contacto</th><th>Email</th><th>Trabajos</th></tr></thead>
            <tbody>@for (client of filteredClients; track client.id) {
              <tr class="clickable-row" tabindex="0" (click)="openClient(client)" (keydown.enter)="openClient(client)"><td><div class="client-cell"><span class="avatar">{{ client.name.charAt(0).toUpperCase() }}</span><div><b>{{ client.name }}</b>@if (client.isArchived) { <span class="badge">Archivado</span> }</div></div></td><td class="mono">{{ client.taxId || '—' }}</td><td>{{ client.contactPerson || '—' }}</td><td>{{ client.email || '—' }}</td><td>{{ client.workCount }} · {{ client.openWorkCount }} abiertos</td></tr>
            } @empty {<tr><td class="table-empty" colspan="5">No hay clientes que coincidan con esta vista.</td></tr>}</tbody>
          </table>
        </div>

        @if (showEditor) {
          <aside class="card client-editor">
            <div class="editor-heading"><div><span class="eyebrow">Detalle</span><h2>{{ editingId ? 'Ficha del cliente' : 'Nuevo cliente' }}</h2></div><button class="btn btn--ghost icon-btn" type="button" aria-label="Cerrar ficha" (click)="closeEditor()"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div>
            <form class="form-grid" [formGroup]="clientForm" (ngSubmit)="saveClient()">
              <div class="field span-2"><label for="client-name">Nombre o razón social <span class="req">*</span></label><input id="client-name" formControlName="name"></div>
              <div class="field"><label for="client-tax">RUT / identificador extranjero</label><input id="client-tax" class="mono" formControlName="taxId"></div>
              <div class="field"><label for="client-contact">Persona de contacto</label><input id="client-contact" formControlName="contactPerson"></div>
              <div class="field"><label for="client-email">Email</label><input id="client-email" type="email" formControlName="email"></div>
              <div class="field"><label for="client-phone">Teléfono</label><input id="client-phone" formControlName="phone"></div>
              <div class="field span-2"><label for="client-address">Dirección</label><textarea id="client-address" rows="2" formControlName="address"></textarea></div>
              <div class="form-actions">
                @if (editingId && !current?.isArchived) {<button class="btn btn--danger" type="button" (click)="archiveClient()"><i class="fa-solid fa-box-archive" aria-hidden="true"></i>Archivar</button>}
                @if (editingId && current?.isArchived && auth.isAdmin()) {<button class="btn" type="button" (click)="restoreClient()"><i class="fa-solid fa-rotate-left" aria-hidden="true"></i>Restaurar</button>}
                <button class="btn btn--primary" type="submit" [disabled]="saving"><i class="fa-solid fa-check" aria-hidden="true"></i>{{ saving ? 'Guardando…' : 'Guardar cliente' }}</button>
              </div>
            </form>

            @if (editingId) {
              <section class="client-section"><h3>Trabajos asociados</h3>
                @for (work of current?.works ?? []; track work.id) {<div class="work-row"><div><b>{{ work.code }}</b> {{ work.name }}<small>{{ work.state }}</small></div><span>{{ work.progressPercent }}%</span></div>}
                @if ((current?.works?.length ?? 0) === 0) {<p class="muted-copy">Todavía no hay trabajos asociados.</p>}
              </section>
              <section class="client-section"><h3>Notas</h3><div class="alert alert--warn"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i><p>No incluyas datos personales sensibles ni información ajena a la relación con el cliente.</p></div>
                <form class="stack" [formGroup]="noteForm" (ngSubmit)="saveNote()">
                  <div class="field"><label for="note-work">Trabajo vinculado (opcional)</label><select id="note-work" formControlName="workItemId"><option value="">Nota general</option>@for (work of current?.works ?? []; track work.id) {<option [value]="work.id">{{ work.code }} · {{ work.name }}</option>}</select></div>
                  <div class="field"><label for="note-text">Nota</label><textarea id="note-text" rows="3" formControlName="text"></textarea></div>
                  <div class="form-actions"><button class="btn btn--primary" type="submit">{{ editingNote ? 'Guardar nota' : 'Agregar nota' }}</button>
                  @if (editingNote) {<button class="btn btn--ghost" type="button" (click)="cancelNoteEdit()">Cancelar</button>}</div>
                </form>
                <div class="notes-list">@for (note of current?.notes ?? []; track note.id) {<article class="note"><div><p>{{ note.text }}</p><small>{{ note.createdByDisplayName }} · {{ note.createdAtUtc }} @if (note.workCode) {· {{ note.workCode }}} @if (note.updatedAtUtc) {· editada}</small></div><button class="btn btn--ghost icon-btn btn--sm" type="button" aria-label="Editar nota" (click)="editNote(note)"><i class="fa-solid fa-pen" aria-hidden="true"></i></button></article>}</div>
              </section>
            }
          </aside>
        }
      </div>
    </section>

    @if (showLeaveDialog) {
      <div class="overlay" (keydown.escape)="resolveLeave('stay')"><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="leave-title">
        <h2 id="leave-title">Cambios sin guardar</h2><p>¿Querés guardar los cambios antes de salir?</p>
        <div class="dialog__foot"><button class="btn btn--danger" type="button" (click)="resolveLeave('discard')">Descartar y salir</button><button class="btn" type="button" autofocus (click)="resolveLeave('stay')">Permanecer</button><button class="btn btn--primary" type="button" (click)="resolveLeave('save')">Guardar y salir</button></div>
      </section></div>
    }
  `,
})
export class ClientsComponent implements OnInit, PendingChangesComponent {
  readonly auth = inject(AuthService);
  private readonly clientsService = inject(ClientsService);
  private readonly formBuilder = inject(FormBuilder);
  clients: ClientSummary[] = []; current: ClientDetail | null = null; search = ''; showArchived = false;
  showEditor = false; editingId: string | null = null; editingNote: ClientNote | null = null;
  saving = false; message = ''; showLeaveDialog = false; private leaveResolver: ((value: boolean) => void) | null = null;

  readonly clientForm = this.formBuilder.nonNullable.group({
    name: ['', Validators.required], taxId: [''], contactPerson: [''], email: ['', Validators.email], phone: [''], address: [''], concurrencyToken: [''],
  });
  readonly noteForm = this.formBuilder.nonNullable.group({ text: ['', Validators.required], workItemId: [''] });

  get filteredClients(): ClientSummary[] {
    const term = this.search.trim().toLocaleLowerCase();
    if (!term) return this.clients;
    return this.clients.filter(client => [client.name, client.taxId, client.contactPerson, client.email]
      .some(value => value?.toLocaleLowerCase().includes(term)));
  }

  async ngOnInit(): Promise<void> { await this.loadClients(); }
  async loadClients(): Promise<void> { this.clients = await firstValueFrom(this.clientsService.list(this.showArchived)); }
  startNew(): void {
    if (this.clientForm.dirty && !window.confirm('¿Descartar los cambios sin guardar y crear otro cliente?')) return;
    this.current = null; this.editingId = null; this.showEditor = true;
    this.clientForm.reset({ name: '', taxId: '', contactPerson: '', email: '', phone: '', address: '', concurrencyToken: '' });
  }
  async openClient(summary: ClientSummary): Promise<void> {
    if (this.clientForm.dirty && !window.confirm('¿Descartar los cambios sin guardar y abrir otro cliente?')) return;
    const client = await firstValueFrom(this.clientsService.get(summary.id)); this.setCurrent(client); this.showEditor = true;
  }
  private setCurrent(client: ClientDetail): void {
    this.current = client; this.editingId = client.id;
    this.clientForm.reset({ name: client.name, taxId: client.taxId ?? '', contactPerson: client.contactPerson ?? '', email: client.email ?? '', phone: client.phone ?? '', address: client.address ?? '', concurrencyToken: client.concurrencyToken });
    this.clientForm.markAsPristine(); this.cancelNoteEdit();
  }
  closeEditor(): void { if (!this.clientForm.dirty || window.confirm('¿Descartar los cambios sin guardar?')) { this.showEditor = false; this.editingId = null; this.current = null; } }

  async saveClient(): Promise<boolean> {
    this.clientForm.markAllAsTouched(); if (this.clientForm.invalid) return false;
    this.saving = true; this.message = '';
    try {
      const raw = this.clientForm.getRawValue();
      const optional = (value: string): string | null => value.trim() || null;
      const input = { name: raw.name.trim(), taxId: optional(raw.taxId), contactPerson: optional(raw.contactPerson), email: optional(raw.email), phone: optional(raw.phone), address: optional(raw.address), concurrencyToken: raw.concurrencyToken || undefined };
      const saved = this.editingId ? await firstValueFrom(this.clientsService.update(this.editingId, input)) : await firstValueFrom(this.clientsService.create(input));
      this.setCurrent(saved); this.message = 'Cliente guardado.'; await this.loadClients(); return true;
    } catch { this.message = 'No se pudo guardar el cliente. Revisá el nombre único, el email o cambios simultáneos.'; return false; }
    finally { this.saving = false; }
  }
  async archiveClient(): Promise<void> {
    if (!this.editingId) return;
    if (this.clientForm.dirty && !window.confirm('¿Archivar este cliente y descartar los cambios sin guardar?')) return;
    try { await firstValueFrom(this.clientsService.archive(this.editingId)); this.message = 'Cliente archivado.'; this.showEditor = false; await this.loadClients(); }
    catch { this.message = 'El cliente no puede archivarse mientras tenga trabajos abiertos.'; }
  }
  async restoreClient(): Promise<void> { if (!this.editingId) return; await firstValueFrom(this.clientsService.restore(this.editingId)); this.message = 'Cliente restaurado.'; this.showEditor = false; await this.loadClients(); }

  editNote(note: ClientNote): void { this.editingNote = note; this.noteForm.setValue({ text: note.text, workItemId: note.workItemId ?? '' }); }
  cancelNoteEdit(): void { this.editingNote = null; this.noteForm.reset({ text: '', workItemId: '' }); }
  async saveNote(): Promise<void> {
    this.noteForm.markAllAsTouched(); if (!this.editingId || this.noteForm.invalid) return;
    const raw = this.noteForm.getRawValue();
    try {
      if (this.editingNote) await firstValueFrom(this.clientsService.updateNote(this.editingId, { ...this.editingNote, text: raw.text.trim(), workItemId: raw.workItemId || null }));
      else await firstValueFrom(this.clientsService.addNote(this.editingId, { text: raw.text.trim(), workItemId: raw.workItemId || null }));
      const refreshed = await firstValueFrom(this.clientsService.get(this.editingId)); this.setCurrent(refreshed); this.message = 'Nota guardada.';
    } catch { this.message = 'No se pudo guardar la nota. Recargá si otro usuario la modificó.'; }
  }

  canDeactivate(): boolean | Promise<boolean> {
    if (!this.clientForm.dirty) return true;
    this.showLeaveDialog = true;
    return new Promise<boolean>(resolve => { this.leaveResolver = resolve; });
  }
  async resolveLeave(choice: 'discard' | 'stay' | 'save'): Promise<void> {
    if (!this.leaveResolver) return;
    if (choice === 'save' && !(await this.saveClient())) return;
    const resolver = this.leaveResolver; this.leaveResolver = null; this.showLeaveDialog = false;
    resolver(choice !== 'stay');
  }
}
