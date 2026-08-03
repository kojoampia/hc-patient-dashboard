import { Routes } from '@angular/router';

import passwordRoute from './password/password.route';
import settingsRoute from './settings/settings.route';

/**
 * The signed-in half of the account area. These render inside the portal shell.
 *
 * Register, activate and password reset are reached *before* signing in, so they live in
 * {@link ./account-public.route} and render on the auth layout instead.
 */
const accountRoutes: Routes = [passwordRoute, settingsRoute];

export default accountRoutes;
