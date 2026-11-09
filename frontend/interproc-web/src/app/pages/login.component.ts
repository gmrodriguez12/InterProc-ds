import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

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

        <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
          <label for="login-email">Email address</label>
          <input id="login-email" type="email" formControlName="email" autocomplete="email"
            placeholder="you@company.com">
          @if (form.controls.email.touched && form.controls.email.invalid) {
            <span class="field-error">Enter a valid email address.</span>
          }

          <label for="login-password">Password</label>
          <input id="login-password" type="password" formControlName="password"
            autocomplete="current-password" placeholder="Enter your password">
          @if (form.controls.password.touched && form.controls.password.invalid) {
            <span class="field-error">Password is required.</span>
          }

          <button class="button button-primary" type="submit">Continue <span aria-hidden="true">→</span></button>
        </form>

        <p class="form-switch">New to InterProc? <a routerLink="/signup">Create an account</a></p>
      </div>
    </section>
  `,
})
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  onSubmit(): void {
    this.form.markAllAsTouched();
  }
}
