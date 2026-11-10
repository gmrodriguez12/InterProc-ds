import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService, AuthValidationErrors } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="auth__box">
      <div class="auth__brand">
        <div class="row">
          <span class="auth__mark"><i class="fa-solid fa-diagram-project" aria-hidden="true"></i></span>
          <span class="brand__name">InterProc</span>
        </div>
        <p class="muted">Acceso interno. Las cuentas las crea un administrador.</p>
      </div>

      <div class="auth__card">
        @if (errorMessage) {
          <div class="alert alert--error" role="alert"><i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i><p>{{ errorMessage }}</p></div>
        }

        <form class="stack" [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
          <div class="field">
          <label for="login-identifier">Usuario o email</label>
          <input id="login-identifier" type="text" formControlName="identifier" autocomplete="username" placeholder="usuario o nombre@empresa.com" [attr.aria-invalid]="identifierHasError">
          @if (form.controls.identifier.touched && form.controls.identifier.invalid) {
            <span class="field__error">Ingresá tu usuario o email.</span>
          }
          @for (message of apiErrors['identifier'] ?? []; track message) {
            <span class="field__error">{{ message }}</span>
          }
          </div>

          <div class="field">
          <label for="login-password">Contraseña</label>
          <input id="login-password" type="password" formControlName="password"
            autocomplete="current-password" placeholder="Ingresá tu contraseña"
            [attr.aria-invalid]="passwordHasError">
          @if (form.controls.password.touched && form.controls.password.invalid) {
            <span class="field__error">La contraseña es obligatoria.</span>
          }
          @for (message of apiErrors['password'] ?? []; track message) {
            <span class="field__error">{{ message }}</span>
          }
          </div>

          <button class="btn btn--primary" type="submit" [disabled]="isSubmitting">
            {{ isSubmitting ? 'Ingresando…' : 'Ingresar' }}
          </button>
        </form>
        <p class="field__hint" style="margin:0;text-align:center">No hay registro público. Todo acceso queda auditado.</p>
      </div>
    </section>
  `,
})
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  isSubmitting = false;
  errorMessage = '';
  apiErrors: AuthValidationErrors = {};

  readonly form = this.formBuilder.nonNullable.group({
    identifier: ['', Validators.required],
    password: ['', Validators.required],
  });

  get identifierHasError(): boolean {
    return this.form.controls.identifier.invalid || (this.apiErrors['identifier']?.length ?? 0) > 0;
  }

  get passwordHasError(): boolean {
    return this.form.controls.password.invalid || (this.apiErrors['password']?.length ?? 0) > 0;
  }

  async onSubmit(): Promise<void> {
    this.form.markAllAsTouched();
    this.errorMessage = '';
    this.apiErrors = {};
    if (this.form.invalid) {
      return;
    }

    this.isSubmitting = true;
    try {
      await firstValueFrom(this.auth.login(this.form.getRawValue()));
      await this.router.navigateByUrl(
        this.auth.currentUser()?.mustChangePassword ? '/change-password' : '/dashboard',
      );
    } catch (error: unknown) {
      this.apiErrors = this.auth.getValidationErrors(error);
      this.errorMessage = this.auth.getErrorMessage(
        error,
        'No pudimos iniciar sesión. Intentá nuevamente.',
      );
    } finally {
      this.isSubmitting = false;
    }
  }
}
