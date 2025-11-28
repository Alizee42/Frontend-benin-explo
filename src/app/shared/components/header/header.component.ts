import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { AuthService, User } from '../../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  @Input() mode: 'normal' | 'compact' = 'normal';

  public menuOpen = false;
  public isCircuitsDropdownOpen = false;
  public isUserDropdownOpen = false;

  public isLoggedIn = false;
  public isAdmin = false;
  public user: User | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Subscribe to auth state
    this.authService.user$.subscribe(user => {
      this.user = user;
      this.isLoggedIn = this.authService.isLoggedIn();
      this.isAdmin = this.authService.isAdmin();
    });

    // Existing navigation logic
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        // ... existing header light logic ...
        let node: ActivatedRoute | null = (this.router.routerState && (this.router.routerState.root as ActivatedRoute)) || this.route;
        let headerLightFromData: boolean | null = null;

        while (node) {
          if (node.snapshot && node.snapshot.data && node.snapshot.data['headerLight'] !== undefined) {
            headerLightFromData = !!node.snapshot.data['headerLight'];
          }
          node = node.firstChild as ActivatedRoute | null;
        }

        const isLightPage = headerLightFromData !== null
          ? headerLightFromData
          : (event.urlAfterRedirects.includes('circuits') || event.urlAfterRedirects.includes('circuit-personnalise'));

        console.debug('Header navigation:', { url: (event as NavigationEnd).urlAfterRedirects, headerLightFromData });
        if (isLightPage) {
          document.body.classList.add('header-light');
          const headerEl = document.querySelector('.site-header') as HTMLElement | null;
          if (headerEl) {
            headerEl.setAttribute('data-header-light', 'true');
            headerEl.classList.add('header-light');
          }
          console.debug('Header: headerLight=true — applied body.header-light');
        } else {
          document.body.classList.remove('header-light');
          const headerEl = document.querySelector('.site-header') as HTMLElement | null;
          if (headerEl) {
            headerEl.removeAttribute('data-header-light');
            headerEl.classList.remove('header-light');
          }
          console.debug('Header: headerLight=false — removed body.header-light');
        }
      }
    });
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  toggleCircuitsDropdown() {
    this.isCircuitsDropdownOpen = !this.isCircuitsDropdownOpen;
  }

  closeCircuitsDropdown() {
    this.isCircuitsDropdownOpen = false;
  }

  closeMenu() {
    this.menuOpen = false;
    this.closeCircuitsDropdown();
    this.closeUserDropdown();
  }

  logout() {
    this.authService.logout();
    this.closeMenu();
  }

  goToDashboard() {
    this.router.navigate(['/admin/dashboard']);
    this.closeMenu();
  }

  toggleUserDropdown() {
    this.isUserDropdownOpen = !this.isUserDropdownOpen;
  }

  closeUserDropdown() {
    this.isUserDropdownOpen = false;
  }

  getUserInitials(): string {
    if (this.user?.prenom && this.user?.nom) {
      return (this.user.prenom.charAt(0) + this.user.nom.charAt(0)).toUpperCase();
    }
    return 'U';
  }

  getUserAvatarColor(): string {
    // Plus de couleur dynamique, on utilise un fond uni avec motif
    return 'var(--be-sand)';
  }
}
