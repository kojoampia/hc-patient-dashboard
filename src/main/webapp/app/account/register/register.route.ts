import { Route } from '@angular/router';

import RegisterComponent from './register.component';

/**
 * `/account/register`, and the path is an external contract.
 *
 * <p>`web.abofonsa.com` links families straight here from its landing page, and holds this path in one place
 * (`PATIENT_REGISTER_PATH`) so that a move is a one-line change there — but only if somebody tells them.</p>
 *
 * <p><strong>A rename will not announce itself.</strong> This is a single-page application, so a wrong path still
 * answers 200 and still serves the shell: the site's button would lead to a blank route while every HTTP check on
 * both sides stayed green. `register.route.spec.ts` fails instead, which is the only thing that will.</p>
 */
const registerRoute: Route = {
  path: 'register',
  component: RegisterComponent,
  title: 'register.title',
};

export default registerRoute;
