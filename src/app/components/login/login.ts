import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  credentials = {
    email: '',
    password: ''
  };
  showPassword = false;
  loading = false;

  constructor(
    private authService: AuthService, 
    private router: Router,
    private toastr: ToastrService
  ) {}

  onSubmit() {
    this.loading = true;
    this.authService.login(this.credentials).subscribe({
      next: (res) => {
        this.toastr.success('Welcome back!', 'Login Successful');
        this.router.navigate(['/']);
      },
      error: (err) => {
        const msg = err.error?.message || 'Login failed. Please check your credentials.';
        this.toastr.error(msg, 'Error');
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}
