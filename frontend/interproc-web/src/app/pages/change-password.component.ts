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
    <section class="auth__box">
      <div class="auth__brand"><div class="row"><span class="auth__mark"><i class="fa-solid fa-key" aria-hidden="true"></i></span><span class="brand__name">InterProc</span></div></div>
      <div class="auth__card">
      <div>
        <span class="eyebrow">Seguridad de la cuenta</span>
        <h1>Elegí una nueva contraseña</h1>
        <p class="muted">Debés reemplazar la contraseña temporal antes de continuar.</p>
      </div>
      @if (errorMessage) { <div class="alert alert--error" role="alert"><i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i><p>{{ errorMessage }}</p></div> }
      <form class="stack" [formGroup]="form" (ngSubmit)="submit()">
        <div class="field"><label for="current-password">Contraseña temporal</label>
        <input id="current-password" type="password" formControlName="currentPassword" autocomplete="current-password">
        </div><div class="field"><label for="new-password">Nueva contraseña</label>
        <input id="new-password" type="password" formControlName="newPassword" autocomplete="new-password">
        <span class="field__hint">Usá al menos 8 caracteres.</span></div>
        <div class="field"><label for="confirm-password">Confirmar nueva contraseña</label>
        <input id="confirm-password" type="password" formControlName="confirmation" autocomplete="new-password">
        @if (form.touched && form.hasError('mismatch')) {
          <span class="field__error">Las contraseñas no coinciden.</span>
        }
        </div>
        <button class="btn btn--primary" type="submit" [disabled]="submitting">
          <i class="fa-solid fa-check" aria-hidden="true"></i>{{ submitting ? 'Guardando…' : 'Guardar contraseña' }}
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
      this.errorMessage = this.auth.getErrorMessage(error, 'No se pudo cambiar la contraseña.');
    } finally {
      this.submitting = false;
    }
  }
}
