import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class SignupComponent {
  userData = {
    email: '',
    password: '',
    username: '',
    firstName: '',
    lastName: ''
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
    this.authService.signup(this.userData).subscribe({
      next: (res) => {
        this.toastr.success('Your account has been created.', 'Signup Successful');
        this.router.navigate(['/']);
      },
      error: (err) => {
        const msg = err.error?.message || 'Signup failed. Please try again.';
        this.toastr.error(msg, 'Error');
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}
