import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

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

        <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
          <label for="signup-email">Email address</label>
          <input id="signup-email" type="email" formControlName="email" autocomplete="email"
            placeholder="you@company.com">
          @if (form.controls.email.touched && form.controls.email.invalid) {
            <span class="field-error">Enter a valid email address.</span>
          }

          <label for="signup-password">Password</label>
          <input id="signup-password" type="password" formControlName="password"
            autocomplete="new-password" placeholder="At least 8 characters">
          @if (form.controls.password.touched && form.controls.password.invalid) {
            <span class="field-error">Use at least 8 characters.</span>
          }

          <button class="button button-primary" type="submit">Create account <span aria-hidden="true">→</span></button>
        </form>

        <p class="form-switch">Already have an account? <a routerLink="/login">Sign in</a></p>
      </div>
    </section>
  `,
})
export class SignupComponent {
  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  onSubmit(): void {
    this.form.markAllAsTouched();
  }
}
