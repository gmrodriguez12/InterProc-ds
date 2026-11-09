import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService, AuthValidationErrors } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
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

        <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
          <label for="login-email">Email address</label>
          <input id="login-email" type="email" formControlName="email" autocomplete="email"
            placeholder="you@company.com" [attr.aria-invalid]="emailHasError">
          @if (form.controls.email.touched && form.controls.email.invalid) {
            <span class="field-error">Enter a valid email address.</span>
          }
          @for (message of apiErrors['email'] ?? []; track message) {
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

        <p class="form-switch">New to InterProc? <a routerLink="/signup">Create an account</a></p>
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
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  get emailHasError(): boolean {
    return this.form.controls.email.invalid || (this.apiErrors['email']?.length ?? 0) > 0;
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
