import { Component, OnInit, OnDestroy, Input, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AuthService, User } from '../../../services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  @Input() mode: 'normal' | 'compact' = 'normal';
  private currentPath = '/';

  public menuOpen = false;
  public isCircuitsDropdownOpen = false;
  public isUserDropdownOpen = false;

  public isLoggedIn = false;
  public isAdmin = false;
  public user: User | null = null;

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentPath = this.normalizePath(this.router.url);
    this.syncAuthState();

    this.authService.user$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.syncAuthState();
    });

    this.router.events.pipe(takeUntil(this.destroy$)).subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.currentPath = this.normalizePath(event.urlAfterRedirects);
        this.closeMenu();
        this.syncAuthState();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node | null;
    if (target && !this.elementRef.nativeElement.contains(target)) {
      this.closeMenu();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMenu();
  }

  toggleMenu(): void {
    this.closeUserDropdown();
    this.closeCircuitsDropdown();
    this.menuOpen = !this.menuOpen;
  }

  toggleCircuitsDropdown(): void {
    if (!this.showPublicNavigation()) {
      return;
    }
    this.closeUserDropdown();
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
    this.router.navigate(['/']);
  }

  goToDashboard() {
    this.router.navigate([this.getDashboardRoute()]);
    this.closeMenu();
  }

  getDashboardRoute(): string {
    return this.isAdmin ? '/admin/dashboard' : '/dashboard';
  }

  getDashboardLabel(): string {
    return this.isAdmin ? 'Tableau de bord' : 'Mon espace';
  }

  toggleUserDropdown(): void {
    this.menuOpen = false;
    this.closeCircuitsDropdown();
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

  // Nav publique : masquée uniquement sur les pages perso du user connecté
  showPublicNavigation(): boolean {
    if (this.mode === 'compact') return false;
    if (this.isLoggedIn && this.isUserSpaceRoute()) return false;
    return true;
  }

  // Liens Mon espace + Mes réservations : toujours visibles quand user connecté (non admin)
  showUserPrivateNav(): boolean {
    return this.isLoggedIn && !this.isAdmin && this.mode !== 'compact';
  }

  // Nav admin compact : tableau de bord
  showAdminNav(): boolean {
    return this.mode === 'compact' && this.isAdmin;
  }

  private isUserSpaceRoute(): boolean {
    return [
      '/dashboard',
      '/mes-reservations',
      '/profil',
      '/parametres',
      '/reservation-hebergement',
      '/paiement',
    ].some(prefix => this.currentPath.startsWith(prefix));
  }

  private syncAuthState(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    this.isAdmin = this.isLoggedIn && this.authService.isAdmin();
    this.user = this.isLoggedIn ? this.authService.getUser() : null;

    if (!this.isLoggedIn) {
      this.closeUserDropdown();
    }
  }

  private normalizePath(url: string): string {
    return (url || '/').split('?')[0].split('#')[0] || '/';
  }

}
