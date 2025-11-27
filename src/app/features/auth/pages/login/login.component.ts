import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      motDePasse: ['', [Validators.required]]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.loading = true;
      this.errorMessage = '';

      const { email, motDePasse } = this.loginForm.value;

      const credentials = { email, motDePasse };

      // Assuming backend has /auth/login endpoint
      this.http.post('http://localhost:8080/auth/login', credentials).subscribe({
        next: (response: any) => {
          console.log('Login successful, role:', response.role);
          localStorage.setItem('token', response.token);
          localStorage.setItem('userRole', response.role);

          if (response.role === 'ADMIN') {
            console.log('Navigating to admin dashboard');
            this.router.navigate(['/admin/dashboard']);
          } else {
            console.log('Navigating to home');
            this.router.navigate(['/']); // redirect to home for users
          }
        },
        error: (error) => {
          console.log('Login error:', error);
          this.errorMessage = 'Identifiants incorrects';
          this.loading = false;
        }
      });
    }
  }
}