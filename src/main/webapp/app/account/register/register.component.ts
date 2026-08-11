import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { AbstractControl, FormGroup, FormControl, ValidationErrors, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of, timer } from 'rxjs';
import { catchError, first, map, switchMap, tap } from 'rxjs/operators';

import { EMAIL_ALREADY_USED_TYPE, LOGIN_ALREADY_USED_TYPE } from 'app/config/error.constants';
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
export default class RegisterComponent implements AfterViewInit {
  @ViewChild('login', { static: false })
  login?: ElementRef;

  doNotMatch = false;
  error = false;
  errorEmailExists = false;
  errorUserExists = false;
  success = false;

  /** Alternatives offered by the gateway when the typed username is taken. */
  usernameSuggestions: string[] = [];

  /** True only when the current login value has been successfully checked with the gateway. */
  private usernameAvailabilityKnown = false;
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

  register(): void {
    this.doNotMatch = false;
    this.error = false;
    this.errorEmailExists = false;
    this.errorUserExists = false;

    const { password, confirmPassword } = this.registerForm.getRawValue();
    if (password !== confirmPassword) {
      this.doNotMatch = true;
    } else {
      const { login, email } = this.registerForm.getRawValue();
      this.registerService
        .save({ login, email, password, langKey: this.translateService.currentLang })
        .subscribe({ next: () => (this.success = true), error: response => this.processError(response) });
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
    this.usernameSuggestions = [];

    return timer(USERNAME_CHECK_DEBOUNCE_MS).pipe(
      switchMap(() => this.registerService.checkUsername(login)),
      tap(result => (this.usernameSuggestions = result.available ? [] : result.suggestions)),
      map(result => (result.available ? null : { usernameTaken: true })),
      // A look-ahead that cannot reach the gateway must not stand between the user and registration.
      // Treating the field as valid hands the decision back to POST /register, which answers
      // authoritatively and already has an error path for a taken login.
      catchError(() => of(null)),
      first(),
    );
  }

  private processError(response: HttpErrorResponse): void {
    if (response.status === 400 && response.error.type === LOGIN_ALREADY_USED_TYPE) {
      this.errorUserExists = true;
    } else if (response.status === 400 && response.error.type === EMAIL_ALREADY_USED_TYPE) {
      this.errorEmailExists = true;
    } else {
      this.error = true;
    }
  }
}
