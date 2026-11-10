import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { ManagedUser, UsersService } from '../services/users.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="resource-page">
      <div class="page-heading">
        <div><p class="eyebrow">ADMINISTRATION</p><h1>Accounts</h1></div>
        <button class="button button-primary compact-button" type="button" (click)="showCreate = !showCreate">New account</button>
      </div>
      @if (message) { <p class="form-alert" role="status">{{ message }}</p> }
      @if (showCreate) {
        <form class="panel grid-form" [formGroup]="form" (ngSubmit)="create()">
          <label>Display name<input formControlName="displayName"></label>
          <label>Username<input formControlName="username" autocomplete="off"></label>
          <label>Email<input formControlName="email" type="email"></label>
          <label>Role<select formControlName="role"><option value="usuario">Usuario</option><option value="admin">Admin</option></select></label>
          <label>Temporary password<input formControlName="temporaryPassword" type="password" autocomplete="new-password"></label>
          <button class="button button-primary compact-button" type="submit">Create account</button>
        </form>
      }
      <div class="panel table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr></thead>
          <tbody>
            @for (user of users; track user.id) {
              <tr>
                <td>{{ user.displayName }}</td><td>{{ user.username }}</td><td>{{ user.email }}</td>
                <td>{{ user.role }}</td><td>{{ user.isActive ? 'Active' : 'Inactive' }}</td>
                <td><button class="text-button" type="button" (click)="toggle(user)">{{ user.isActive ? 'Deactivate' : 'Activate' }}</button></td>
              </tr>
            } @empty { <tr><td colspan="6">No accounts found.</td></tr> }
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
      this.showCreate = false; this.message = 'Account created.'; await this.load();
    } catch { this.message = 'The account could not be created. Review unique fields and password rules.'; }
  }

  async toggle(user: ManagedUser): Promise<void> {
    try {
      await firstValueFrom(this.usersService.update({ ...user, isActive: !user.isActive }));
      this.message = 'Account updated.'; await this.load();
    } catch { this.message = 'The account could not be updated. The last active admin is protected.'; }
  }
}
