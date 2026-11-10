import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService, AuthValidationErrors } from '../services/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="single-form-page">
      <div class="form-card">
        <div class="form-heading">
          <p class="eyebrow">SECURE YOUR ACCOUNT</p>
          <h2>Change temporary password</h2>
          <p>Choose a private password before continuing to InterProc.</p>
        </div>

        @if (errorMessage) {
          <p class="form-alert" role="alert">{{ errorMessage }}</p>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
          <label for="current-password">Temporary password</label>
          <input id="current-password" type="password" formControlName="currentPassword"
            autocomplete="current-password">
          @for (message of apiErrors['currentPassword'] ?? []; track message) {
            <span class="field-error">{{ message }}</span>
          }

          <label for="new-password">New password</label>
          <input id="new-password" type="password" formControlName="newPassword"
            autocomplete="new-password">
          <span class="field-hint">At least 8 characters with uppercase, lowercase, number and symbol.</span>
          @for (message of apiErrors['newPassword'] ?? []; track message) {
            <span class="field-error">{{ message }}</span>
          }

          <label for="confirm-password">Confirm new password</label>
          <input id="confirm-password" type="password" formControlName="confirmPassword"
            autocomplete="new-password">
          @if (passwordsDoNotMatch) {
            <span class="field-error">Passwords do not match.</span>
          }

          <button class="button button-primary" type="submit" [disabled]="isSubmitting">
            {{ isSubmitting ? 'Changing password…' : 'Save and continue' }}
            <span aria-hidden="true">→</span>
          </button>
        </form>
      </div>
    </section>
  `,
})
export class ChangePasswordComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  isSubmitting = false;
  errorMessage = '';
  apiErrors: AuthValidationErrors = {};

  readonly form = this.formBuilder.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  });

  get passwordsDoNotMatch(): boolean {
    return this.form.controls.confirmPassword.touched &&
      this.form.controls.newPassword.value !== this.form.controls.confirmPassword.value;
  }

  async onSubmit(): Promise<void> {
    this.form.markAllAsTouched();
    this.errorMessage = '';
    this.apiErrors = {};
    if (this.form.invalid || this.passwordsDoNotMatch) {
      return;
    }

    this.isSubmitting = true;
    try {
      const { currentPassword, newPassword } = this.form.getRawValue();
      await firstValueFrom(this.auth.changePassword({ currentPassword, newPassword }));
      await this.router.navigateByUrl('/dashboard');
    } catch (error: unknown) {
      this.apiErrors = this.auth.getValidationErrors(error);
      this.errorMessage = this.auth.getErrorMessage(
        error,
        'We could not change the password. Please try again.',
      );
    } finally {
      this.isSubmitting = false;
    }
  }
}
