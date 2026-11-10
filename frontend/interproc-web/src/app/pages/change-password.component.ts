import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="form-card narrow-card">
      <div class="form-heading">
        <p class="eyebrow">ACCOUNT SECURITY</p>
        <h2>Choose a new password</h2>
        <p>Your temporary password must be replaced before continuing.</p>
      </div>
      @if (errorMessage) { <p class="form-alert" role="alert">{{ errorMessage }}</p> }
      <form [formGroup]="form" (ngSubmit)="submit()">
        <label for="current-password">Temporary password</label>
        <input id="current-password" type="password" formControlName="currentPassword" autocomplete="current-password">
        <label for="new-password">New password</label>
        <input id="new-password" type="password" formControlName="newPassword" autocomplete="new-password">
        <label for="confirm-password">Confirm new password</label>
        <input id="confirm-password" type="password" formControlName="confirmation" autocomplete="new-password">
        @if (form.touched && form.hasError('mismatch')) {
          <span class="field-error">Passwords do not match.</span>
        }
        <button class="button button-primary" type="submit" [disabled]="submitting">
          {{ submitting ? 'Saving…' : 'Save password' }} <span aria-hidden="true">→</span>
        </button>
      </form>
    </section>
  `,
})
export class ChangePasswordComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  submitting = false;
  errorMessage = '';

  readonly form = this.formBuilder.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmation: ['', Validators.required],
  }, {
    validators: (group) => group.get('newPassword')?.value === group.get('confirmation')?.value
      ? null
      : { mismatch: true },
  });

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.submitting = true;
    this.errorMessage = '';
    try {
      const { currentPassword, newPassword } = this.form.getRawValue();
      await firstValueFrom(this.auth.changePassword({ currentPassword, newPassword }));
      await this.router.navigateByUrl('/dashboard');
    } catch (error: unknown) {
      this.errorMessage = this.auth.getErrorMessage(error, 'The password could not be changed.');
    } finally {
      this.submitting = false;
    }
  }
}
