import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { Account, AccountsService } from '../services/accounts.service';
import { AuthService, AuthValidationErrors } from '../services/auth.service';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="accounts-page">
      <div class="section-heading">
        <div>
          <p class="eyebrow"><span class="eyebrow-line"></span> ADMINISTRATION</p>
          <h1>User accounts</h1>
          <p class="intro">Create internal accounts and control access to InterProc.</p>
        </div>
      </div>

      @if (pageError) {
        <p class="form-alert" role="alert">{{ pageError }}</p>
      }

      <div class="accounts-grid">
        <div class="form-card account-form">
          <div class="form-heading">
            <p class="eyebrow">NEW ACCOUNT</p>
            <h2>Create user</h2>
            <p>The user must replace the temporary password on first login.</p>
          </div>

          <form [formGroup]="form" (ngSubmit)="createAccount()" novalidate>
            <label for="account-username">Username</label>
            <input id="account-username" type="text" formControlName="username"
              autocomplete="off" placeholder="e.g. ana.perez">
            <span class="field-hint">3–50 letters, numbers, dots, underscores or hyphens. No @.</span>
            @for (message of apiErrors['username'] ?? []; track message) {
              <span class="field-error">{{ message }}</span>
            }

            <label for="account-email">Email</label>
            <input id="account-email" type="email" formControlName="email"
              autocomplete="off" placeholder="ana@company.com">
            @for (message of apiErrors['email'] ?? []; track message) {
              <span class="field-error">{{ message }}</span>
            }

            <label for="account-password">Temporary password</label>
            <input id="account-password" type="password" formControlName="temporaryPassword"
              autocomplete="new-password">
            <span class="field-hint">At least 8 characters with uppercase, lowercase, number and symbol.</span>
            @for (message of apiErrors['temporaryPassword'] ?? apiErrors['newPassword'] ?? []; track message) {
              <span class="field-error">{{ message }}</span>
            }

            <label for="account-role">Role</label>
            <select id="account-role" formControlName="role">
              <option value="usuario">usuario</option>
              <option value="admin">admin</option>
            </select>

            <button class="button button-primary" type="submit" [disabled]="isCreating">
              {{ isCreating ? 'Creating…' : 'Create account' }} <span aria-hidden="true">→</span>
            </button>
          </form>
        </div>

        <div class="accounts-list-card">
          <div class="list-heading">
            <div>
              <p class="eyebrow">CURRENT ACCESS</p>
              <h2>Accounts</h2>
            </div>
            <span>{{ accounts.length }}</span>
          </div>

          @if (isLoading) {
            <p class="empty-state">Loading accounts…</p>
          } @else if (accounts.length === 0) {
            <p class="empty-state">No accounts found.</p>
          } @else {
            <div class="account-list">
              @for (account of accounts; track account.id) {
                <article class="account-row" [class.inactive]="!account.isActive">
                  <div class="account-avatar">{{ account.username.charAt(0).toUpperCase() }}</div>
                  <div class="account-details">
                    <strong>{{ account.username }}</strong>
                    <span>{{ account.email }}</span>
                    <div class="account-badges">
                      <span class="badge">{{ account.role }}</span>
                      @if (account.mustChangePassword) {
                        <span class="badge badge-warning">temporary password</span>
                      }
                      @if (!account.isActive) {
                        <span class="badge badge-inactive">inactive</span>
                      }
                    </div>
                  </div>
                  <button class="button button-secondary account-toggle" type="button"
                    [disabled]="updatingAccountId === account.id || account.id === auth.currentUser()?.id"
                    (click)="toggleActive(account)">
                    {{ account.isActive ? 'Deactivate' : 'Activate' }}
                  </button>
                </article>
              }
            </div>
          }
        </div>
      </div>
    </section>
  `,
})
export class AccountsComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly accountsService = inject(AccountsService);
  readonly auth = inject(AuthService);

  accounts: Account[] = [];
  isLoading = true;
  isCreating = false;
  updatingAccountId: string | null = null;
  pageError = '';
  apiErrors: AuthValidationErrors = {};

  readonly form = this.formBuilder.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50), Validators.pattern(/^[A-Za-z0-9._-]+$/)]],
    email: ['', [Validators.required, Validators.email]],
    temporaryPassword: ['', [Validators.required, Validators.minLength(8)]],
    role: this.formBuilder.nonNullable.control<'admin' | 'usuario'>('usuario'),
  });

  async ngOnInit(): Promise<void> {
    await this.loadAccounts();
  }

  async createAccount(): Promise<void> {
    this.form.markAllAsTouched();
    this.pageError = '';
    this.apiErrors = {};
    if (this.form.invalid) {
      this.pageError = 'Please review the account fields.';
      return;
    }

    this.isCreating = true;
    try {
      const account = await firstValueFrom(this.accountsService.create(this.form.getRawValue()));
      this.accounts = [...this.accounts, account]
        .sort((left, right) => left.username.localeCompare(right.username));
      this.form.reset({ username: '', email: '', temporaryPassword: '', role: 'usuario' });
    } catch (error: unknown) {
      this.apiErrors = this.auth.getValidationErrors(error);
      this.pageError = this.auth.getErrorMessage(error, 'We could not create the account.');
    } finally {
      this.isCreating = false;
    }
  }

  async toggleActive(account: Account): Promise<void> {
    this.pageError = '';
    this.updatingAccountId = account.id;
    try {
      const updated = await firstValueFrom(
        this.accountsService.setActive(account.id, !account.isActive),
      );
      this.accounts = this.accounts.map((item) => item.id === updated.id ? updated : item);
    } catch (error: unknown) {
      this.pageError = this.auth.getErrorMessage(error, 'We could not update the account.');
    } finally {
      this.updatingAccountId = null;
    }
  }

  private async loadAccounts(): Promise<void> {
    this.isLoading = true;
    this.pageError = '';
    try {
      this.accounts = await firstValueFrom(this.accountsService.list());
    } catch (error: unknown) {
      this.pageError = this.auth.getErrorMessage(error, 'We could not load the accounts.');
    } finally {
      this.isLoading = false;
    }
  }
}
