import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { MermaidDiagramComponent } from '../components/mermaid-diagram.component';
import { AuthService } from '../services/auth.service';
import { CatalogService, ProcedureDetail, ProcedureSummary, ProcedureType, ProcedureVersion } from '../services/catalog.service';

@Component({
  selector: 'app-procedures',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, MermaidDiagramComponent],
  template: `
    <section class="resource-page">
      <div class="page-heading">
        <div><p class="eyebrow">CATALOG</p><h1>Procedures</h1></div>
        <div class="heading-actions">
          <button class="button secondary-button compact-button" type="button" (click)="showTypes = !showTypes">Types</button>
          <button class="button button-primary compact-button" type="button" (click)="startNew()">New procedure</button>
        </div>
      </div>
      @if (message) { <p class="form-alert" role="status">{{ message }}</p> }

      @if (showTypes) {
        <div class="panel type-manager">
          <form class="inline-form" [formGroup]="typeForm" (ngSubmit)="saveType()">
            <label>Name<input formControlName="name"></label>
            <label>FontAwesome icon<input formControlName="icon" placeholder="fa-folder"></label>
            <button class="button button-primary compact-button" type="submit">{{ editingType ? 'Save type' : 'Add type' }}</button>
            @if (editingType) { <button class="text-button" type="button" (click)="cancelTypeEdit()">Cancel</button> }
          </form>
          <div class="chip-list">
            @for (type of types; track type.id) {
              <span class="type-chip"><b>{{ type.name }}</b> {{ type.procedureCount }}
                <button class="text-button" type="button" (click)="editType(type)">Edit</button>
                <button class="text-button danger" type="button" (click)="archiveType(type)">Archive</button>
              </span>
            }
          </div>
        </div>
      }

      @if (showEditor) {
        <div class="panel editor-panel">
          <div class="editor-heading"><h2>{{ editingId ? 'Edit procedure' : 'New procedure' }}</h2><button class="text-button" type="button" (click)="closeEditor()">Close</button></div>
          <form class="grid-form" [formGroup]="procedureForm" (ngSubmit)="saveProcedure()">
            <label>Type<select formControlName="procedureTypeId">@for (type of types; track type.id) {<option [value]="type.id">{{ type.name }}</option>}</select></label>
            <label>Title<input formControlName="title"></label>
            <label>FontAwesome icon<input formControlName="icon"></label>
            <label>Estimated minutes<input type="number" min="1" formControlName="estimatedMinutes"></label>
            <label class="span-2">Short description<textarea rows="2" formControlName="shortDescription"></textarea></label>
            <label class="span-2">Steps (plain text)<textarea rows="8" formControlName="steps"></textarea></label>
            <label class="span-2">Mermaid diagram (optional)<textarea rows="7" formControlName="mermaidDiagram"></textarea></label>
            @if (editingId) { <label class="span-2">Reason when steps or diagram changed<textarea rows="2" formControlName="versionReason"></textarea></label> }
            <button class="button button-primary compact-button" type="submit" [disabled]="saving">{{ saving ? 'Saving…' : 'Save procedure' }}</button>
          </form>
          <app-mermaid-diagram [code]="procedureForm.controls.mermaidDiagram.value" />
          @if (versions.length) {
            <div class="version-list"><h3>Version history</h3>
              @for (version of versions; track version.id) {
                <article><div><b>v{{ version.number }}</b> · {{ version.createdByDisplayName }} · {{ version.createdAtUtc }} @if (version.isCurrent) {<span class="badge">Current</span>}</div><p>{{ version.reason }}</p>
                  @if (auth.isAdmin() && !version.isCurrent) {<button class="text-button danger" type="button" (click)="deleteVersion(version)">Delete permanently</button>}
                </article>
              }
            </div>
          }
        </div>
      }

      <div class="catalog-toolbar">
        <div class="tabs"><button [class.active]="!selectedTypeId" (click)="selectType('')">All</button>@for (type of types; track type.id) {<button [class.active]="selectedTypeId === type.id" (click)="selectType(type.id)">{{ type.name }}</button>}</div>
        <input [(ngModel)]="search" (ngModelChange)="loadProcedures()" placeholder="Search procedures">
        <label class="toggle"><input type="checkbox" [(ngModel)]="showArchived" (change)="loadProcedures()"> Archived</label>
      </div>
      <div class="card-grid">
        @for (procedure of procedures; track procedure.id) {
          <article class="resource-card" (click)="editProcedure(procedure)">
            <span class="card-icon">{{ procedure.icon }}</span><div><p class="eyebrow">{{ procedure.procedureTypeName }} · V{{ procedure.currentVersionNumber }}</p><h2>{{ procedure.title }}</h2><p>{{ procedure.shortDescription }}</p><small>{{ procedure.estimatedMinutes ? procedure.estimatedMinutes + ' min' : 'No estimate' }}</small></div>
            <div class="card-actions">
              @if (!procedure.isArchived) {<button class="text-button danger" type="button" (click)="archiveProcedure(procedure, $event)">Archive</button>}
              @else if (auth.isAdmin()) {<button class="text-button" type="button" (click)="restoreProcedure(procedure, $event)">Restore</button>}
            </div>
          </article>
        } @empty { <p class="empty-state">No procedures match this view.</p> }
      </div>
    </section>
  `,
})
export class ProceduresComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly catalog = inject(CatalogService);
  private readonly formBuilder = inject(FormBuilder);
  types: ProcedureType[] = []; procedures: ProcedureSummary[] = []; versions: ProcedureVersion[] = [];
  selectedTypeId = ''; search = ''; showArchived = false; showTypes = false; showEditor = false;
  editingId: string | null = null; editingType: ProcedureType | null = null; saving = false; message = '';

  readonly typeForm = this.formBuilder.nonNullable.group({ name: ['', Validators.required], icon: ['fa-folder', Validators.required] });
  readonly procedureForm = this.formBuilder.group({
    procedureTypeId: ['', Validators.required], title: ['', Validators.required], icon: ['fa-list-check', Validators.required],
    shortDescription: [''], estimatedMinutes: [null as number | null, Validators.min(1)], steps: ['', Validators.required],
    mermaidDiagram: [''], versionReason: [''], concurrencyToken: [''],
  });

  async ngOnInit(): Promise<void> { await this.loadTypes(); await this.loadProcedures(); }
  async loadTypes(): Promise<void> { this.types = await firstValueFrom(this.catalog.listTypes()); }
  async loadProcedures(): Promise<void> { this.procedures = await firstValueFrom(this.catalog.listProcedures(this.selectedTypeId || undefined, this.showArchived, this.search)); }
  async selectType(id: string): Promise<void> { this.selectedTypeId = id; await this.loadProcedures(); }

  startNew(): void {
    this.editingId = null; this.versions = []; this.showEditor = true;
    this.procedureForm.reset({ procedureTypeId: this.selectedTypeId || this.types[0]?.id || '', title: '', icon: 'fa-list-check', shortDescription: '', estimatedMinutes: null, steps: '', mermaidDiagram: '', versionReason: '', concurrencyToken: '' });
  }
  closeEditor(): void { this.showEditor = false; this.editingId = null; this.versions = []; }

  async editProcedure(summary: ProcedureSummary): Promise<void> {
    const detail = await firstValueFrom(this.catalog.getProcedure(summary.id));
    this.editingId = detail.id; this.showEditor = true; this.patchProcedure(detail);
    this.versions = await firstValueFrom(this.catalog.versions(detail.id));
  }
  private patchProcedure(detail: ProcedureDetail): void {
    this.procedureForm.reset({ procedureTypeId: detail.procedureTypeId, title: detail.title, icon: detail.icon,
      shortDescription: detail.shortDescription, estimatedMinutes: detail.estimatedMinutes, steps: detail.steps,
      mermaidDiagram: detail.mermaidDiagram ?? '', versionReason: '', concurrencyToken: detail.concurrencyToken });
  }
  async saveProcedure(): Promise<void> {
    this.procedureForm.markAllAsTouched(); if (this.procedureForm.invalid) return;
    this.saving = true; this.message = '';
    try {
      const raw = this.procedureForm.getRawValue();
      const input = { ...raw, procedureTypeId: raw.procedureTypeId!, title: raw.title!, icon: raw.icon!, shortDescription: raw.shortDescription ?? '',
        steps: raw.steps!, mermaidDiagram: raw.mermaidDiagram?.trim() || null, versionReason: raw.versionReason?.trim() || null, concurrencyToken: raw.concurrencyToken ?? undefined };
      const saved = this.editingId
        ? await firstValueFrom(this.catalog.updateProcedure(this.editingId, input))
        : await firstValueFrom(this.catalog.createProcedure(input));
      this.editingId = saved.id; this.patchProcedure(saved); this.versions = await firstValueFrom(this.catalog.versions(saved.id));
      this.message = 'Procedure saved.'; await this.loadTypes(); await this.loadProcedures();
    } catch { this.message = 'The procedure could not be saved. Check unique fields, version reason, or concurrent changes.'; }
    finally { this.saving = false; }
  }

  editType(type: ProcedureType): void { this.editingType = type; this.typeForm.setValue({ name: type.name, icon: type.icon }); }
  cancelTypeEdit(): void { this.editingType = null; this.typeForm.reset({ name: '', icon: 'fa-folder' }); }
  async saveType(): Promise<void> {
    this.typeForm.markAllAsTouched(); if (this.typeForm.invalid) return;
    try {
      if (this.editingType) await firstValueFrom(this.catalog.updateType({ ...this.editingType, ...this.typeForm.getRawValue() }));
      else await firstValueFrom(this.catalog.createType(this.typeForm.getRawValue()));
      this.cancelTypeEdit(); await this.loadTypes(); this.message = 'Procedure type saved.';
    } catch { this.message = 'The procedure type could not be saved. Its active name must be unique.'; }
  }
  async archiveType(type: ProcedureType): Promise<void> {
    try { await firstValueFrom(this.catalog.archiveType(type.id)); await this.loadTypes(); this.message = 'Type archived.'; }
    catch { this.message = 'Archive active procedures before archiving their type.'; }
  }
  async archiveProcedure(procedure: ProcedureSummary, event: Event): Promise<void> { event.stopPropagation(); await firstValueFrom(this.catalog.archiveProcedure(procedure.id)); await this.loadProcedures(); await this.loadTypes(); }
  async restoreProcedure(procedure: ProcedureSummary, event: Event): Promise<void> { event.stopPropagation(); await firstValueFrom(this.catalog.restoreProcedure(procedure.id)); await this.loadProcedures(); await this.loadTypes(); }
  async deleteVersion(version: ProcedureVersion): Promise<void> {
    if (!this.editingId || !window.confirm('This version will be permanently deleted. This action is irreversible.')) return;
    try { await firstValueFrom(this.catalog.deleteVersion(this.editingId, version.id)); this.versions = await firstValueFrom(this.catalog.versions(this.editingId)); }
    catch { this.message = 'The current or a used version cannot be deleted.'; }
  }
}
