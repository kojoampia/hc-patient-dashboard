import registerRoute from './register.route';
import RegisterComponent from './register.component';

/**
 * The handoff path, pinned.
 *
 * <p>`web.abofonsa.com` sends families to `/account/register`, and the sending side cannot detect a rename: this is
 * a single-page application, so a wrong path answers 200 and serves the shell. Their button would lead nowhere
 * useful while every automated check on both sides reported success — which is precisely why their contract asks to
 * be told if it moves, and why asking is not enough on its own.</p>
 *
 * <p>This test is the mechanism that turns "please tell us" into something that cannot be forgotten. If it fails,
 * the change is fine to make — but `PATIENT_REGISTER_PATH` in `hc-abofonsa-web` has to move with it.</p>
 */
describe('the /account/register handoff path', () => {
  it('is still register, under the account routes', () => {
    expect(registerRoute.path).toBe('register');
  });

  it('still resolves to the registration form', () => {
    // Path alone is not enough: pointing it at a different component would keep the URL working and still break
    // the handoff, and that would look like a refactor rather than a contract breach.
    expect(registerRoute.component).toBe(RegisterComponent);
  });
});
