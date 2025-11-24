import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd, ActivatedRoute, RouterState } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  public menuOpen = false;

  constructor(private router: Router, private route: ActivatedRoute) {}

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
  }
  ngOnInit() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        // Try to read a route-level data flag `headerLight` (recommended)
        // traverse from the router root to catch data set on lazy routes
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
          // also set a data attribute on the header element so styles can target it
          const headerEl = document.querySelector('.site-header') as HTMLElement | null;
          if (headerEl) {
            headerEl.setAttribute('data-header-light', 'true');
            // add a class on the header element itself for more robust CSS targeting
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

}
