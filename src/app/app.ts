import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from './services/auth';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, FormsModule, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
  private authService = inject(AuthService);
  public router = inject(Router);
  private toastr = inject(ToastrService);
  
  currentUser$ = this.authService.currentUser$;
  showProfileMenu = false;
  searchQuery = '';

  onSearch() {
    this.router.navigate(['/'], { queryParams: { q: this.searchQuery } });
  }

  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
  }

  logout() {
    this.authService.logout();
    this.showProfileMenu = false;
    this.toastr.info('You have been logged out', 'Logged Out');
  }
}
