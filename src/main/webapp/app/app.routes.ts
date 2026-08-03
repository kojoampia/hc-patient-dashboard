import { Routes } from '@angular/router';

import { Authority } from 'app/config/authority.constants';
import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { errorRoute } from './layouts/error/error.route';

import LoginComponent from './login/login.component';
import AuthShellComponent from './layouts/auth-shell/auth-shell.component';
import ShellComponent from './layouts/shell/shell.component';

/**
 * Two layouts, not one.
 *
 * Sign-in, registration, activation and password reset are reached before there is an account to
 * navigate, so they render on the auth layout. Wrapping them in the portal shell would show a
 * sidebar full of destinations the visitor cannot open.
 *
 * Everything else is a child of ShellComponent, which supplies the sidebar, topbar and tab bar,
 * and is guarded as a whole — there is no signed-out view of the portal.
 */
const routes: Routes = [
  {
    // Both layouts below are empty-path parents, so the router would otherwise resolve `/` to
    // whichever is declared first and render it with an empty outlet. Sending the root somewhere
    // concrete removes the ambiguity: `overview` matches nothing under the auth layout, so the
    // router falls through to the portal shell, and its guard bounces to `/login` when signed out.
    path: '',
    pathMatch: 'full',
    redirectTo: 'overview',
  },
  {
    path: '',
    component: AuthShellComponent,
    children: [
      {
        path: 'login',
        component: LoginComponent,
        title: 'login.title',
      },
      {
        path: 'account',
        loadChildren: () => import('./account/account-public.route'),
      },
    ],
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [UserRouteAccessService],
    children: [
      {
        path: 'admin',
        data: {
          authorities: [Authority.ADMIN],
        },
        canActivate: [UserRouteAccessService],
        loadChildren: () => import('./admin/admin.routes'),
      },
      {
        path: 'account',
        loadChildren: () => import('./account/account.route'),
      },
      {
        // The generated entity CRUD is an administrative surface, not a patient-facing one — it
        // edits any patient's records. It was previously unreachable because entity.routes.ts
        // was empty; now that it is wired, it is wired behind ROLE_ADMIN.
        path: 'entities',
        data: {
          authorities: [Authority.ADMIN],
        },
        canActivate: [UserRouteAccessService],
        loadChildren: () => import('./entities/entity.routes'),
      },
      {
        path: '',
        loadChildren: () => import('./portal/portal.routes'),
      },
    ],
  },
  ...errorRoute,
];

export default routes;
