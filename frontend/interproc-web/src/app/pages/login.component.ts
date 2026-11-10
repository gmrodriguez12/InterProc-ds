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
    <section class="auth-layout">
      <div class="auth-copy">
        <p class="eyebrow"><span class="eyebrow-line"></span> YOUR WORK, IN SYNC</p>
        <h1>Make every<br>process <span>flow.</span></h1>
        <p class="intro">
          A clearer view of your work starts here. Sign in to pick up where your
          team left off.
        </p>
        <div class="quote-card">
          <span class="quote-mark" aria-hidden="true">“</span>
          <p>Great work happens when every step has a clear place to go.</p>
          <span class="quote-caption">A little more clarity, every day.</span>
        </div>
      </div>

      <div class="form-card">
        <div class="form-heading">
          <p class="eyebrow">WELCOME BACK</p>
          <h2>Sign in</h2>
          <p>Enter your details to continue to InterProc.</p>
        </div>

        @if (errorMessage) {
          <p class="form-alert" role="alert">{{ errorMessage }}</p>
        }

        @if (auth.setupRequired()) {
          <p class="form-alert setup-notice" role="status">
            No administrator exists yet. Run the bootstrap-admin command before signing in.
          </p>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
          <label for="login-identifier">Username or email</label>
          <input id="login-identifier" type="text" formControlName="identifier" autocomplete="username"
            placeholder="username or you@company.com" [attr.aria-invalid]="identifierHasError">
          @if (form.controls.identifier.touched && form.controls.identifier.invalid) {
            <span class="field-error">Username or email is required.</span>
          }
          @for (message of apiErrors['identifier'] ?? []; track message) {
            <span class="field-error">{{ message }}</span>
          }

          <label for="login-password">Password</label>
          <input id="login-password" type="password" formControlName="password"
            autocomplete="current-password" placeholder="Enter your password"
            [attr.aria-invalid]="passwordHasError">
          @if (form.controls.password.touched && form.controls.password.invalid) {
            <span class="field-error">Password is required.</span>
          }
          @for (message of apiErrors['password'] ?? []; track message) {
            <span class="field-error">{{ message }}</span>
          }

          <button class="button button-primary" type="submit" [disabled]="isSubmitting">
            {{ isSubmitting ? 'Signing in…' : 'Continue' }} <span aria-hidden="true">→</span>
          </button>
        </form>
      </div>
    </section>
  `,
})
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  readonly auth = inject(AuthService);
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
      await this.router.navigateByUrl('/dashboard');
    } catch (error: unknown) {
      this.apiErrors = this.auth.getValidationErrors(error);
      this.errorMessage = this.auth.getErrorMessage(
        error,
        'We could not sign you in. Please try again.',
      );
    } finally {
      this.isSubmitting = false;
    }
  }
}
