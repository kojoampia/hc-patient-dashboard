import { Routes } from '@angular/router';

import activateRoute from './activate/activate.route';
import passwordResetFinishRoute from './password-reset/finish/password-reset-finish.route';
import passwordResetInitRoute from './password-reset/init/password-reset-init.route';
import registerRoute from './register/register.route';

/**
 * Account screens reachable without signing in. They render on the auth layout, not the portal
 * shell — a sidebar of destinations you cannot open yet is worse than no sidebar.
 */
const accountPublicRoutes: Routes = [activateRoute, passwordResetFinishRoute, passwordResetInitRoute, registerRoute];

export default accountPublicRoutes;
