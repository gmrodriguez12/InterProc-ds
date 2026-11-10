import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { ManagedUser, UsersService } from '../services/users.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="page">
      <div class="page__head">
        <div><span class="eyebrow">Administración</span><h1>Cuentas</h1><p>Accesos internos y roles de InterProc.</p></div>
        <div class="page__actions"><button class="btn btn--primary" type="button" (click)="showCreate = !showCreate"><i class="fa-solid fa-user-plus" aria-hidden="true"></i>Nueva cuenta</button></div>
      </div>
      @if (message) { <div class="alert" role="status"><i class="fa-solid fa-circle-info" aria-hidden="true"></i><p>{{ message }}</p></div> }
      @if (showCreate) {
        <form class="card form-grid" [formGroup]="form" (ngSubmit)="create()">
          <div class="field"><label for="user-display">Nombre visible</label><input id="user-display" formControlName="displayName"></div>
          <div class="field"><label for="user-name">Usuario</label><input id="user-name" formControlName="username" autocomplete="off"></div>
          <div class="field"><label for="user-email">Email</label><input id="user-email" formControlName="email" type="email"></div>
          <div class="field"><label for="user-role">Rol</label><select id="user-role" formControlName="role"><option value="usuario">Usuario</option><option value="admin">Admin</option></select></div>
          <div class="field span-2"><label for="user-password">Contraseña temporal</label><input id="user-password" formControlName="temporaryPassword" type="password" autocomplete="new-password"><span class="field__hint">La persona deberá cambiarla en su primer ingreso.</span></div>
          <div class="form-actions"><button class="btn btn--ghost" type="button" (click)="showCreate = false">Cancelar</button><button class="btn btn--primary" type="submit"><i class="fa-solid fa-check" aria-hidden="true"></i>Crear cuenta</button></div>
        </form>
      }
      <div class="table-wrap">
        <table>
          <thead><tr><th>Nombre</th><th>Usuario</th><th>Email</th><th>Rol</th><th>Estado</th><th><span class="sr-only">Acciones</span></th></tr></thead>
          <tbody>
            @for (user of users; track user.id) {
              <tr>
                <td><div class="who"><span class="avatar">{{ user.displayName.charAt(0).toUpperCase() }}</span><span class="who__meta"><strong>{{ user.displayName }}</strong></span></div></td><td class="mono">{{ user.username }}</td><td>{{ user.email }}</td>
                <td><span class="badge" [class.badge--primary]="user.role === 'admin'">{{ user.role }}</span></td><td><span class="badge" [class.st-terminado]="user.isActive" [class.st-cancelado]="!user.isActive">{{ user.isActive ? 'Activa' : 'Inactiva' }}</span></td>
                <td><div class="table-actions"><button class="btn btn--sm" type="button" (click)="toggle(user)">{{ user.isActive ? 'Desactivar' : 'Activar' }}</button></div></td>
              </tr>
            } @empty { <tr><td class="table-empty" colspan="6">No hay cuentas.</td></tr> }
          </tbody>
        </table>
      </div>
    </section>
  `,
})
export class UsersComponent implements OnInit {
  private readonly usersService = inject(UsersService);
  private readonly formBuilder = inject(FormBuilder);
  users: ManagedUser[] = [];
  showCreate = false;
  message = '';
  readonly form = this.formBuilder.nonNullable.group({
    displayName: ['', Validators.required], username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]], role: ['usuario' as const, Validators.required],
    temporaryPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  async ngOnInit(): Promise<void> { await this.load(); }

  async load(): Promise<void> { this.users = await firstValueFrom(this.usersService.list()); }

  async create(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    try {
      await firstValueFrom(this.usersService.create(this.form.getRawValue()));
      this.form.reset({ role: 'usuario', displayName: '', username: '', email: '', temporaryPassword: '' });
      this.showCreate = false; this.message = 'Cuenta creada.'; await this.load();
    } catch { this.message = 'No se pudo crear la cuenta. Revisá los campos únicos y las reglas de contraseña.'; }
  }

  async toggle(user: ManagedUser): Promise<void> {
    try {
      await firstValueFrom(this.usersService.update({ ...user, isActive: !user.isActive }));
      this.message = 'Cuenta actualizada.'; await this.load();
    } catch { this.message = 'No se pudo actualizar la cuenta. El último administrador activo está protegido.'; }
  }
}
