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
    <section class="resource-page">
      <div class="page-heading">
        <div><p class="eyebrow">RELATIONSHIPS</p><h1>Clients</h1></div>
        <button class="button button-primary compact-button" type="button" (click)="startNew()">New client</button>
      </div>
      @if (message) { <p class="form-alert" role="status">{{ message }}</p> }
      <div class="catalog-toolbar">
        <input class="list-search" [(ngModel)]="search" placeholder="Search name, RUT, contact, or email">
        <label class="toggle"><input type="checkbox" [(ngModel)]="showArchived" (change)="loadClients()"> Archived</label>
      </div>

      <div class="client-layout" [class.with-editor]="showEditor">
        <div class="panel table-wrap">
          <table><thead><tr><th>Name</th><th>RUT / ID</th><th>Contact</th><th>Email</th><th>Works</th></tr></thead>
            <tbody>@for (client of filteredClients; track client.id) {
              <tr class="clickable-row" (click)="openClient(client)"><td><b>{{ client.name }}</b></td><td>{{ client.taxId || '—' }}</td><td>{{ client.contactPerson || '—' }}</td><td>{{ client.email || '—' }}</td><td>{{ client.workCount }} / {{ client.openWorkCount }} open</td></tr>
            } @empty {<tr><td colspan="5">No clients match this view.</td></tr>}</tbody>
          </table>
        </div>

        @if (showEditor) {
          <aside class="panel client-editor">
            <div class="editor-heading"><h2>{{ editingId ? 'Client details' : 'New client' }}</h2><button class="text-button" type="button" (click)="closeEditor()">Close</button></div>
            <form class="grid-form" [formGroup]="clientForm" (ngSubmit)="saveClient()">
              <label class="span-2">Name or legal name<input formControlName="name"></label>
              <label>RUT / foreign ID<input formControlName="taxId"></label>
              <label>Contact person<input formControlName="contactPerson"></label>
              <label>Email<input type="email" formControlName="email"></label>
              <label>Phone<input formControlName="phone"></label>
              <label class="span-2">Address<textarea rows="2" formControlName="address"></textarea></label>
              <button class="button button-primary compact-button" type="submit" [disabled]="saving">{{ saving ? 'Saving…' : 'Save client' }}</button>
              @if (editingId && !current?.isArchived) {<button class="button danger-button compact-button" type="button" (click)="archiveClient()">Archive</button>}
              @if (editingId && current?.isArchived && auth.isAdmin()) {<button class="button secondary-button compact-button" type="button" (click)="restoreClient()">Restore</button>}
            </form>

            @if (editingId) {
              <section class="client-section"><h3>Associated work</h3>
                @for (work of current?.works ?? []; track work.id) {<div class="work-row"><div><b>{{ work.code }}</b> {{ work.name }}<small>{{ work.state }}</small></div><span>{{ work.progressPercent }}%</span></div>}
                @if ((current?.works?.length ?? 0) === 0) {<p class="muted-copy">No associated work yet.</p>}
              </section>
              <section class="client-section"><h3>Notes</h3><p class="privacy-warning">⚠ Do not include sensitive personal data or information unrelated to the client relationship.</p>
                <form [formGroup]="noteForm" (ngSubmit)="saveNote()">
                  <label>Linked work (optional)<select formControlName="workItemId"><option value="">General note</option>@for (work of current?.works ?? []; track work.id) {<option [value]="work.id">{{ work.code }} · {{ work.name }}</option>}</select></label>
                  <label>Note<textarea rows="3" formControlName="text"></textarea></label>
                  <button class="button button-primary compact-button" type="submit">{{ editingNote ? 'Save note' : 'Add note' }}</button>
                  @if (editingNote) {<button class="text-button" type="button" (click)="cancelNoteEdit()">Cancel</button>}
                </form>
                <div class="notes-list">@for (note of current?.notes ?? []; track note.id) {<article><p>{{ note.text }}</p><small>{{ note.createdByDisplayName }} · {{ note.createdAtUtc }} @if (note.workCode) {· {{ note.workCode }}} @if (note.updatedAtUtc) {· edited}</small><button class="text-button" type="button" (click)="editNote(note)">Edit</button></article>}</div>
              </section>
            }
          </aside>
        }
      </div>
    </section>

    @if (showLeaveDialog) {
      <div class="modal-backdrop" role="presentation"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="leave-title">
        <h2 id="leave-title">Unsaved changes</h2><p>Save your changes before leaving?</p>
        <div class="modal-actions"><button class="button danger-button compact-button" type="button" (click)="resolveLeave('discard')">Discard and leave</button><button class="button secondary-button compact-button" type="button" (click)="resolveLeave('stay')">Stay</button><button class="button button-primary compact-button" type="button" (click)="resolveLeave('save')">Save and leave</button></div>
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
    if (this.clientForm.dirty && !window.confirm('Discard unsaved changes and create another client?')) return;
    this.current = null; this.editingId = null; this.showEditor = true;
    this.clientForm.reset({ name: '', taxId: '', contactPerson: '', email: '', phone: '', address: '', concurrencyToken: '' });
  }
  async openClient(summary: ClientSummary): Promise<void> {
    if (this.clientForm.dirty && !window.confirm('Discard unsaved changes and open another client?')) return;
    const client = await firstValueFrom(this.clientsService.get(summary.id)); this.setCurrent(client); this.showEditor = true;
  }
  private setCurrent(client: ClientDetail): void {
    this.current = client; this.editingId = client.id;
    this.clientForm.reset({ name: client.name, taxId: client.taxId ?? '', contactPerson: client.contactPerson ?? '', email: client.email ?? '', phone: client.phone ?? '', address: client.address ?? '', concurrencyToken: client.concurrencyToken });
    this.clientForm.markAsPristine(); this.cancelNoteEdit();
  }
  closeEditor(): void { if (!this.clientForm.dirty || window.confirm('Discard unsaved changes?')) { this.showEditor = false; this.editingId = null; this.current = null; } }

  async saveClient(): Promise<boolean> {
    this.clientForm.markAllAsTouched(); if (this.clientForm.invalid) return false;
    this.saving = true; this.message = '';
    try {
      const raw = this.clientForm.getRawValue();
      const optional = (value: string): string | null => value.trim() || null;
      const input = { name: raw.name.trim(), taxId: optional(raw.taxId), contactPerson: optional(raw.contactPerson), email: optional(raw.email), phone: optional(raw.phone), address: optional(raw.address), concurrencyToken: raw.concurrencyToken || undefined };
      const saved = this.editingId ? await firstValueFrom(this.clientsService.update(this.editingId, input)) : await firstValueFrom(this.clientsService.create(input));
      this.setCurrent(saved); this.message = 'Client saved.'; await this.loadClients(); return true;
    } catch { this.message = 'The client could not be saved. Check its unique name, email, or concurrent changes.'; return false; }
    finally { this.saving = false; }
  }
  async archiveClient(): Promise<void> {
    if (!this.editingId) return;
    if (this.clientForm.dirty && !window.confirm('Archive this client and discard unsaved changes?')) return;
    try { await firstValueFrom(this.clientsService.archive(this.editingId)); this.message = 'Client archived.'; this.showEditor = false; await this.loadClients(); }
    catch { this.message = 'The client cannot be archived while it has open work items.'; }
  }
  async restoreClient(): Promise<void> { if (!this.editingId) return; await firstValueFrom(this.clientsService.restore(this.editingId)); this.message = 'Client restored.'; this.showEditor = false; await this.loadClients(); }

  editNote(note: ClientNote): void { this.editingNote = note; this.noteForm.setValue({ text: note.text, workItemId: note.workItemId ?? '' }); }
  cancelNoteEdit(): void { this.editingNote = null; this.noteForm.reset({ text: '', workItemId: '' }); }
  async saveNote(): Promise<void> {
    this.noteForm.markAllAsTouched(); if (!this.editingId || this.noteForm.invalid) return;
    const raw = this.noteForm.getRawValue();
    try {
      if (this.editingNote) await firstValueFrom(this.clientsService.updateNote(this.editingId, { ...this.editingNote, text: raw.text.trim(), workItemId: raw.workItemId || null }));
      else await firstValueFrom(this.clientsService.addNote(this.editingId, { text: raw.text.trim(), workItemId: raw.workItemId || null }));
      const refreshed = await firstValueFrom(this.clientsService.get(this.editingId)); this.setCurrent(refreshed); this.message = 'Note saved.';
    } catch { this.message = 'The note could not be saved. Reload if another user changed it.'; }
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
