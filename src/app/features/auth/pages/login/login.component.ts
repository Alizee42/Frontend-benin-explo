import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  errorMessage = '';
  showPassword = false;
  registerQueryParams: { returnUrl: string } | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      motDePasse: ['', [Validators.required]]
    });

    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    this.registerQueryParams = returnUrl ? { returnUrl } : null;
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      this.errorMessage = '';

      const { email, motDePasse } = this.loginForm.value;
      const credentials = { email: email.trim(), motDePasse: motDePasse.trim() };

      this.authService.login(credentials).subscribe({
        next: (response) => {
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
          const target = returnUrl || (this.authService.isAdmin() ? '/admin/dashboard' : '/dashboard');
          this.loading = false;
          this.router.navigateByUrl(target);
        },
        error: (error) => {
          this.errorMessage = 'Identifiants incorrects';
          this.loading = false;
        }
      });
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
    this.cdr.detectChanges();
  }

  forgotPasswordMessage = '';

  forgotPassword() {
    this.forgotPasswordMessage = 'Pour réinitialiser votre mot de passe, contactez l\'agence par email.';
  }
}
