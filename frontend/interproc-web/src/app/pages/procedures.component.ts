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
    <section class="page">
      <div class="page__head">
        <div><span class="eyebrow">Catálogo</span><h1>Procedimientos</h1><p>Gestioná procedimientos reutilizables y su historial de versiones.</p></div>
        <div class="page__actions">
          <button class="btn" type="button" (click)="showTypes = !showTypes"><i class="fa-solid fa-layer-group" aria-hidden="true"></i>Tipos</button>
          <button class="btn btn--primary" type="button" (click)="startNew()"><i class="fa-solid fa-plus" aria-hidden="true"></i>Nuevo procedimiento</button>
        </div>
      </div>
      @if (message) { <div class="alert" role="status"><i class="fa-solid fa-circle-info" aria-hidden="true"></i><p>{{ message }}</p></div> }

      @if (showTypes) {
        <section class="card stack type-manager">
          <div class="editor-heading"><div><span class="eyebrow">Configuración</span><h2>Tipos de procedimiento</h2></div></div>
          <form class="inline-form" [formGroup]="typeForm" (ngSubmit)="saveType()">
            <div class="field"><label for="type-name">Nombre</label><input id="type-name" formControlName="name"></div>
            <div class="field"><label for="type-icon">Ícono Font Awesome</label><input id="type-icon" class="mono" formControlName="icon" placeholder="fa-folder"></div>
            <div class="form-actions"><button class="btn btn--primary" type="submit">{{ editingType ? 'Guardar tipo' : 'Agregar tipo' }}</button>
            @if (editingType) { <button class="btn btn--ghost" type="button" (click)="cancelTypeEdit()">Cancelar</button> }</div>
          </form>
          <div class="chip-list">
            @for (type of types; track type.id) {
              <span class="type-chip"><i [class]="'fa-solid ' + type.icon" aria-hidden="true"></i><b>{{ type.name }}</b><span class="mono">{{ type.procedureCount }}</span>
                <span class="type-chip__actions"><button class="btn btn--ghost icon-btn btn--sm" type="button" aria-label="Editar tipo" (click)="editType(type)"><i class="fa-solid fa-pen" aria-hidden="true"></i></button>
                <button class="btn btn--ghost icon-btn btn--sm" type="button" aria-label="Archivar tipo" (click)="archiveType(type)"><i class="fa-solid fa-box-archive" aria-hidden="true"></i></button></span>
              </span>
            }
          </div>
        </section>
      }

      @if (showEditor) {
        <section class="card stack editor-panel">
          <div class="editor-heading"><div><span class="eyebrow">Detalle</span><h2>{{ editingId ? 'Editar procedimiento' : 'Nuevo procedimiento' }}</h2></div><button class="btn btn--ghost icon-btn" type="button" aria-label="Cerrar editor" (click)="closeEditor()"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div>
          <form class="form-grid" [formGroup]="procedureForm" (ngSubmit)="saveProcedure()">
            <div class="field"><label for="procedure-type">Tipo</label><select id="procedure-type" formControlName="procedureTypeId">@for (type of types; track type.id) {<option [value]="type.id">{{ type.name }}</option>}</select></div>
            <div class="field"><label for="procedure-title">Título</label><input id="procedure-title" formControlName="title"></div>
            <div class="field"><label for="procedure-icon">Ícono Font Awesome</label><input id="procedure-icon" class="mono" formControlName="icon"></div>
            <div class="field"><label for="procedure-minutes">Tiempo estimado en minutos</label><input id="procedure-minutes" type="number" min="1" formControlName="estimatedMinutes"></div>
            <div class="field span-2"><label for="procedure-description">Descripción breve</label><textarea id="procedure-description" rows="2" formControlName="shortDescription"></textarea></div>
            <div class="field span-2"><label for="procedure-steps">Pasos</label><textarea id="procedure-steps" rows="8" formControlName="steps"></textarea></div>
            <div class="field span-2"><label for="procedure-mermaid">Diagrama Mermaid (opcional)</label><textarea id="procedure-mermaid" rows="7" formControlName="mermaidDiagram"></textarea></div>
            @if (editingId) { <div class="field span-2"><label for="procedure-reason">Motivo del cambio de pasos o diagrama</label><textarea id="procedure-reason" rows="2" formControlName="versionReason"></textarea><span class="field__hint">Obligatorio cuando se crea una nueva versión.</span></div> }
            <div class="form-actions"><button class="btn btn--ghost" type="button" (click)="closeEditor()">Cancelar</button><button class="btn btn--primary" type="submit" [disabled]="saving"><i class="fa-solid fa-check" aria-hidden="true"></i>{{ saving ? 'Guardando…' : 'Guardar procedimiento' }}</button></div>
          </form>
          <app-mermaid-diagram [code]="procedureForm.controls.mermaidDiagram.value" />
          @if (versions.length) {
            <div class="version-list"><h3>Historial de versiones</h3>
              @for (version of versions; track version.id) {
                <article class="version"><div class="version__head"><b class="mono">v{{ version.number }}</b><span>{{ version.createdByDisplayName }} · {{ version.createdAtUtc }}</span>@if (version.isCurrent) {<span class="badge badge--primary">Vigente</span>}</div><p>{{ version.reason }}</p>
                  @if (auth.isAdmin() && !version.isCurrent) {<div><button class="btn btn--danger btn--sm" type="button" (click)="deleteVersion(version)"><i class="fa-solid fa-trash" aria-hidden="true"></i>Eliminar definitivamente</button></div>}
                </article>
              }
            </div>
          }
        </section>
      }

      <div class="catalog-toolbar">
        <div class="tabs" aria-label="Filtrar por tipo"><button class="tab" [class.is-active]="!selectedTypeId" (click)="selectType('')"><i class="fa-solid fa-layer-group" aria-hidden="true"></i>Todos</button>@for (type of types; track type.id) {<button class="tab" [class.is-active]="selectedTypeId === type.id" (click)="selectType(type.id)"><i [class]="'fa-solid ' + type.icon" aria-hidden="true"></i>{{ type.name }}</button>}</div>
        <div class="field"><label for="procedure-search">Buscar</label><input id="procedure-search" [(ngModel)]="search" (ngModelChange)="loadProcedures()" placeholder="Buscar procedimientos…"></div>
        <label class="toggle"><input type="checkbox" [(ngModel)]="showArchived" (change)="loadProcedures()"> Mostrar archivados</label>
      </div>
      <div class="grid-cards">
        @for (procedure of procedures; track procedure.id) {
          <article class="card proc" tabindex="0" (click)="editProcedure(procedure)" (keydown.enter)="editProcedure(procedure)">
            <div class="proc__top"><span class="proc__icon"><i [class]="'fa-solid ' + procedure.icon" aria-hidden="true"></i></span><div><div class="proc__title">{{ procedure.title }}</div><span class="field__hint">{{ procedure.procedureTypeName }} · v{{ procedure.currentVersionNumber }}</span></div></div>
            <p class="proc__desc">{{ procedure.shortDescription || 'Sin descripción.' }}</p>
            <div class="proc__foot"><span class="pill mono">{{ procedure.estimatedMinutes ? procedure.estimatedMinutes + ' min' : 'Sin estimación' }}</span>@if (procedure.isArchived) {<span class="badge">Archivado</span>}
            <div class="proc__actions">
              <button class="btn btn--ghost icon-btn btn--sm" type="button" aria-label="Editar procedimiento" (click)="editProcedure(procedure); $event.stopPropagation()"><i class="fa-solid fa-pen" aria-hidden="true"></i></button>
              @if (!procedure.isArchived) {<button class="btn btn--ghost icon-btn btn--sm" type="button" aria-label="Archivar procedimiento" (click)="archiveProcedure(procedure, $event)"><i class="fa-solid fa-box-archive" aria-hidden="true"></i></button>}
              @else if (auth.isAdmin()) {<button class="btn btn--ghost icon-btn btn--sm" type="button" aria-label="Restaurar procedimiento" (click)="restoreProcedure(procedure, $event)"><i class="fa-solid fa-rotate-left" aria-hidden="true"></i></button>}
            </div>
            </div>
          </article>
        } @empty { <div class="empty"><i class="fa-solid fa-book" aria-hidden="true"></i><p>No hay procedimientos que coincidan con esta vista.</p></div> }
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
      this.message = 'Procedimiento guardado.'; await this.loadTypes(); await this.loadProcedures();
    } catch { this.message = 'No se pudo guardar el procedimiento. Revisá los campos únicos, el motivo de versión o cambios simultáneos.'; }
    finally { this.saving = false; }
  }

  editType(type: ProcedureType): void { this.editingType = type; this.typeForm.setValue({ name: type.name, icon: type.icon }); }
  cancelTypeEdit(): void { this.editingType = null; this.typeForm.reset({ name: '', icon: 'fa-folder' }); }
  async saveType(): Promise<void> {
    this.typeForm.markAllAsTouched(); if (this.typeForm.invalid) return;
    try {
      if (this.editingType) await firstValueFrom(this.catalog.updateType({ ...this.editingType, ...this.typeForm.getRawValue() }));
      else await firstValueFrom(this.catalog.createType(this.typeForm.getRawValue()));
      this.cancelTypeEdit(); await this.loadTypes(); this.message = 'Tipo de procedimiento guardado.';
    } catch { this.message = 'No se pudo guardar el tipo. El nombre activo debe ser único.'; }
  }
  async archiveType(type: ProcedureType): Promise<void> {
    try { await firstValueFrom(this.catalog.archiveType(type.id)); await this.loadTypes(); this.message = 'Tipo archivado.'; }
    catch { this.message = 'Archivá sus procedimientos activos antes de archivar el tipo.'; }
  }
  async archiveProcedure(procedure: ProcedureSummary, event: Event): Promise<void> { event.stopPropagation(); await firstValueFrom(this.catalog.archiveProcedure(procedure.id)); await this.loadProcedures(); await this.loadTypes(); }
  async restoreProcedure(procedure: ProcedureSummary, event: Event): Promise<void> { event.stopPropagation(); await firstValueFrom(this.catalog.restoreProcedure(procedure.id)); await this.loadProcedures(); await this.loadTypes(); }
  async deleteVersion(version: ProcedureVersion): Promise<void> {
    if (!this.editingId || !window.confirm('Esta versión se eliminará definitivamente. La acción es irreversible.')) return;
    try { await firstValueFrom(this.catalog.deleteVersion(this.editingId, version.id)); this.versions = await firstValueFrom(this.catalog.versions(this.editingId)); }
    catch { this.message = 'La versión vigente o una versión utilizada no puede eliminarse.'; }
  }
}
