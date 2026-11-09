import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService, AuthValidationErrors } from '../services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth-layout">
      <div class="auth-copy">
        <p class="eyebrow"><span class="eyebrow-line"></span> A BETTER WAY TO WORK</p>
        <h1>Start with<br>a <span>clear path.</span></h1>
        <p class="intro">
          Bring your processes together and give every task a next step. Your
          workspace starts with you.
        </p>
        <div class="feature-list">
          <div><span class="feature-icon" aria-hidden="true">↗</span><span>See the whole process, at a glance.</span></div>
          <div><span class="feature-icon" aria-hidden="true">✓</span><span>Keep each next step moving.</span></div>
          <div><span class="feature-icon" aria-hidden="true">◎</span><span>Bring your team onto the same page.</span></div>
        </div>
      </div>

      <div class="form-card">
        <div class="form-heading">
          <p class="eyebrow">GET STARTED</p>
          <h2>Create your account</h2>
          <p>Set up your details to get started with InterProc.</p>
        </div>

        @if (errorMessage) {
          <p class="form-alert" role="alert">{{ errorMessage }}</p>
        }
        @for (message of apiErrors['account'] ?? []; track message) {
          <p class="form-alert" role="alert">{{ message }}</p>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
          <label for="signup-email">Email address</label>
          <input id="signup-email" type="email" formControlName="email" autocomplete="email"
            placeholder="you@company.com" [attr.aria-invalid]="emailHasError">
          @if (form.controls.email.touched && form.controls.email.invalid) {
            <span class="field-error">Enter a valid email address.</span>
          }
          @for (message of apiErrors['email'] ?? []; track message) {
            <span class="field-error">{{ message }}</span>
          }

          <label for="signup-password">Password</label>
          <input id="signup-password" type="password" formControlName="password"
            autocomplete="new-password" placeholder="At least 8 characters"
            [attr.aria-invalid]="passwordHasError">
          @if (form.controls.password.touched && form.controls.password.invalid) {
            <span class="field-error">
              @if (form.controls.password.hasError('required')) {
                Password is required.
              } @else if (form.controls.password.hasError('minlength')) {
                Use at least 8 characters.
              } @else {
                Include an uppercase letter, a lowercase letter, a number, and a symbol.
              }
            </span>
          }
          @for (message of apiErrors['password'] ?? []; track message) {
            <span class="field-error">{{ message }}</span>
          }

          <button class="button button-primary" type="submit" [disabled]="isSubmitting">
            {{ isSubmitting ? 'Creating account…' : 'Create account' }} <span aria-hidden="true">→</span>
          </button>
        </form>

        <p class="form-switch">Already have an account? <a routerLink="/login">Sign in</a></p>
      </div>
    </section>
  `,
})
export class SignupComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  isSubmitting = false;
  errorMessage = '';
  apiErrors: AuthValidationErrors = {};

  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/),
      ],
    ],
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
      await firstValueFrom(this.auth.signup(this.form.getRawValue()));
      await this.router.navigateByUrl('/dashboard');
    } catch (error: unknown) {
      this.apiErrors = this.auth.getValidationErrors(error);
      this.errorMessage = this.auth.getErrorMessage(
        error,
        'We could not create your account. Please try again.',
      );
    } finally {
      this.isSubmitting = false;
    }
  }
}
