import { Component, AfterViewInit, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AbstractControl, FormGroup, FormControl, ValidationErrors, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of, timer } from 'rxjs';
import { catchError, first, map, switchMap, tap } from 'rxjs/operators';

import { EMAIL_ALREADY_USED_TYPE, LOGIN_ALREADY_USED_TYPE } from 'app/config/error.constants';
import { LANGUAGES } from 'app/config/language.constants';
import { handoffSource } from './handoff';
import SharedModule from 'app/shared/shared.module';
import PasswordStrengthBarComponent from '../password/password-strength-bar/password-strength-bar.component';
import { RegisterService } from './register.service';

/** How long the field must be still before the look-ahead asks the gateway. */
export const USERNAME_CHECK_DEBOUNCE_MS = 400;

@Component({
    selector: 'hpd-register',
    imports: [SharedModule, RouterModule, FormsModule, ReactiveFormsModule, PasswordStrengthBarComponent],
    templateUrl: './register.component.html'
})
export default class RegisterComponent implements AfterViewInit, OnInit {
  private readonly route = inject(ActivatedRoute);

  /**
   * Where this family came from, when the sending surface said so.
   *
   * <p>Carried to the gateway on the registration payload and stored on the account, because a funnel nobody can
   * join is an offer nobody can end. Allow-listed rather than passed through — see {@link handoffSource}.</p>
   */
  private source: string | null = null;

  @ViewChild('login', { static: false })
  login?: ElementRef;

  // Signals, not plain fields, and this is the whole of the success-banner fix.
  //
  // These are written from inside the HTTP subscribe below, and a plain assignment there updated the
  // component without repainting it: registration returned 201, `success` became true, and the user
  // kept looking at the filled-in form with no confirmation. Verified directly against a production
  // build — ng.getComponent showed `error: true` within 500ms of a failed submit while the alert
  // stayed absent for a further six seconds, and ng.applyChanges() rendered it immediately.
  //
  // markForCheck() would not have been enough: it marks a view dirty but still needs a tick to
  // arrive, and no tick was arriving. A signal write notifies Angular's scheduler itself, so the
  // repaint does not depend on whatever failed to notify it here.
  doNotMatch = signal(false);
  error = signal(false);
  errorEmailExists = signal(false);
  errorUserExists = signal(false);
  success = signal(false);

  /** Alternatives offered by the gateway when the typed username is taken. */
  usernameSuggestions = signal<string[]>([]);

  registerForm = new FormGroup({
    login: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(1),
        Validators.maxLength(50),
        Validators.pattern('^[a-zA-Z0-9!$&*+=?^_`{|}~.-]+@[a-zA-Z0-9-]+(?:\\.[a-zA-Z0-9-]+)*$|^[_.@A-Za-z0-9-]+$'),
      ],
      asyncValidators: [control => this.checkUsernameAvailable(control)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(5), Validators.maxLength(254), Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(4), Validators.maxLength(50)],
    }),
    confirmPassword: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(4), Validators.maxLength(50)],
    }),
  });

  constructor(
    private translateService: TranslateService,
    private registerService: RegisterService,
  ) {}

  ngAfterViewInit(): void {
    if (this.login) {
      this.login.nativeElement.focus();
    }
  }

  /** True once the gateway has confirmed the typed username is free — drives the green field. */
  get usernameAvailable(): boolean {
    const control = this.registerForm.controls.login;
    return control.valid && control.value.length > 0 && (control.dirty || control.touched);
  }

  get usernameTaken(): boolean {
    return this.registerForm.controls.login.hasError('usernameTaken');
  }

  get usernameChecking(): boolean {
    return this.registerForm.controls.login.pending;
  }

  /** Puts a suggested username into the field, which re-runs the look-ahead against it. */
  useSuggestion(suggestion: string): void {
    this.registerForm.controls.login.setValue(suggestion);
    this.registerForm.controls.login.markAsDirty();
  }

  /**
   * Honours the two parameters `web.abofonsa.com` sends with the handoff link.
   *
   * <p>`?locale=` is the language the family was reading when they pressed the button. Landing them on a form in
   * a language they did not choose is the whole failure this prevents, and it is invisible from this side —
   * nothing errors, the form simply arrives in English.</p>
   *
   * <p><strong>It degrades rather than validating.</strong> An unknown, misspelled or absent locale leaves the
   * language exactly as it was, because people bookmark and share these links with the query string mangled and a
   * broken parameter must never cost somebody a working registration form.</p>
   *
   * <p>Nothing is read from the query string beyond these two. The sending contract states that no personal data
   * is in the link and none may ever be added; reading only what is named is how this side keeps that true even
   * if the other side forgets.</p>
   */
  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;

    const locale = params.get('locale');
    if (locale !== null && LANGUAGES.includes(locale)) {
      // Also sets what the form submits: the payload below sends translateService.currentLang, so the account is
      // created in the language they were reading rather than the one they happened to land in.
      this.translateService.use(locale);
    }

    this.source = handoffSource(params.get('src'));
  }

  register(): void {
    this.doNotMatch.set(false);
    this.error.set(false);
    this.errorEmailExists.set(false);
    this.errorUserExists.set(false);

    const { password, confirmPassword } = this.registerForm.getRawValue();
    if (password !== confirmPassword) {
      this.doNotMatch.set(true);
    } else {
      const { login, email } = this.registerForm.getRawValue();
      this.registerService
        .save({ login, email, password, langKey: this.translateService.currentLang, source: this.source })
        .subscribe({ next: () => this.success.set(true), error: response => this.processError(response) });
    }
  }

  /**
   * Async validator for the username field.
   *
   * Angular only runs async validators once the synchronous ones pass, so a username that is empty,
   * too long, or not matching the login pattern never reaches the gateway — the look-ahead cannot be
   * used to probe with values registration would reject anyway.
   *
   * The debounce is a `timer` rather than a `debounceTime` operator because each validator run gets a
   * fresh observable: Angular unsubscribes the previous one the moment the value changes, which
   * cancels the pending timer and any in-flight request. That is what keeps this to one request per
   * pause rather than one per keystroke.
   */
  private checkUsernameAvailable(control: AbstractControl): Observable<ValidationErrors | null> {
    const login = (control.value as string).trim();
    this.usernameSuggestions.set([]);

    return timer(USERNAME_CHECK_DEBOUNCE_MS).pipe(
      switchMap(() => this.registerService.checkUsername(login)),
      tap(result => this.usernameSuggestions.set(result.available ? [] : result.suggestions)),
      map(result => (result.available ? null : { usernameTaken: true })),
      // A look-ahead that cannot reach the gateway must not stand between the user and registration.
      // Treating the field as valid hands the decision back to POST /register, which answers
      // authoritatively and already has an error path for a taken login.
      catchError(() => of(null)),
      first(),
    );
  }

  private processError(response: HttpErrorResponse): void {
    // `response.error` is the parsed problem+json body, but it is a string when the body could not be
    // parsed — hence the optional access rather than response.error.type, which would throw inside an
    // RxJS error handler and leave every flag false.
    const type = (response.error as { type?: string } | null)?.type;
    if (response.status === 400 && type === LOGIN_ALREADY_USED_TYPE) {
      this.errorUserExists.set(true);
    } else if (response.status === 400 && type === EMAIL_ALREADY_USED_TYPE) {
      this.errorEmailExists.set(true);
    } else {
      this.error.set(true);
    }
  }
}
