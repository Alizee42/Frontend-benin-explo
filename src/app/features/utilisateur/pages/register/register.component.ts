import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { AuthService, RegisterRequest, User } from '../../../../services/auth.service';

const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('motDePasse')?.value ?? '';
  const confirmation = control.get('confirmationMotDePasse')?.value ?? '';

  if (!confirmation) {
    return null;
  }

  return password === confirmation ? null : { passwordMismatch: true };
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  errorMessage = '';
  showPassword = false;
  showConfirmationPassword = false;
  loginQueryParams: { returnUrl: string } | null = null;
  confirmationModalOpen = false;
  createdUser: User | null = null;
  emailDeliveryLabel = '';
  autoLoginSucceeded = false;
  continueUrl = '/mes-reservations';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.registerForm = this.fb.group({
      nom: ['', [Validators.required, Validators.maxLength(100)]],
      prenom: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
      telephone: ['', [Validators.required, Validators.pattern(/^[0-9+()\-\s]{8,20}$/)]],
      motDePasse: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(255)]],
      confirmationMotDePasse: ['', [Validators.required]]
    }, { validators: passwordMatchValidator });

    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    this.loginQueryParams = returnUrl ? { returnUrl } : null;
    this.continueUrl = returnUrl || '/mes-reservations';
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.confirmationModalOpen = false;
    this.createdUser = null;
    this.emailDeliveryLabel = '';
    this.autoLoginSucceeded = false;

    const payload: RegisterRequest = {
      nom: this.registerForm.get('nom')?.value?.trim() || '',
      prenom: this.registerForm.get('prenom')?.value?.trim() || '',
      email: this.registerForm.get('email')?.value?.trim() || '',
      telephone: this.registerForm.get('telephone')?.value?.trim() || '',
      motDePasse: this.registerForm.get('motDePasse')?.value || ''
    };

    this.authService.register(payload).subscribe({
      next: (user) => this.loginAfterRegister(payload.email, payload.motDePasse, user),
      error: (error) => {
        this.errorMessage = this.extractErrorMessage(error, 'Impossible de creer le compte pour le moment.');
        this.loading = false;
      }
    });
  }

  togglePassword(field: 'main' | 'confirm'): void {
    if (field === 'main') {
      this.showPassword = !this.showPassword;
      return;
    }

    this.showConfirmationPassword = !this.showConfirmationPassword;
  }

  hasPasswordMismatch(): boolean {
    return !!(
      this.registerForm.hasError('passwordMismatch') &&
      this.registerForm.get('confirmationMotDePasse')?.touched
    );
  }

  closeConfirmationModal(): void {
    this.confirmationModalOpen = false;
  }

  continueAfterRegistration(): void {
    this.confirmationModalOpen = false;

    if (this.autoLoginSucceeded) {
      this.router.navigateByUrl(this.continueUrl);
      return;
    }

    this.router.navigate(['/login'], this.loginQueryParams ? { queryParams: this.loginQueryParams } : undefined);
  }

  getPrimaryActionLabel(): string {
    if (!this.autoLoginSucceeded) {
      return 'Aller a la connexion';
    }

    return this.continueUrl === '/mes-reservations'
      ? 'Voir mon espace'
      : 'Continuer';
  }

  getSecondaryActionLabel(): string {
    return this.autoLoginSucceeded ? 'Rester ici' : 'Fermer';
  }

  private loginAfterRegister(email: string, motDePasse: string, user: User): void {
    this.createdUser = user;
    this.emailDeliveryLabel = user.email || email;

    this.authService.login({ email, motDePasse }).subscribe({
      next: () => {
        this.loading = false;
        this.autoLoginSucceeded = true;
        this.confirmationModalOpen = true;
      },
      error: () => {
        this.loading = false;
        this.autoLoginSucceeded = false;
        this.confirmationModalOpen = true;
      }
    });
  }

  private extractErrorMessage(error: any, fallback: string): string {
    if (typeof error?.error === 'string' && error.error.trim()) {
      return error.error;
    }

    if (typeof error?.error?.message === 'string' && error.error.message.trim()) {
      return error.error.message;
    }

    return fallback;
  }
}
