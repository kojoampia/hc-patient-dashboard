jest.mock('app/core/auth/account.service');

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { FormBuilder } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import RegisterComponent, { USERNAME_CHECK_DEBOUNCE_MS } from './register.component';
import { RegisterService } from './register.service';

/**
 * The username look-ahead on the registration form.
 *
 * Deliberately separate from register.component.spec.ts, which covers submission. These tests are
 * about a field that talks to the gateway while the user types, and the behaviour worth pinning is
 * about timing and failure — how often it asks, and what happens when the answer never comes.
 */
describe('RegisterComponent username look-ahead', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let comp: RegisterComponent;
  let registerService: RegisterService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), RegisterComponent],
      providers: [
      // RegisterComponent reads the handoff query string on init, so it needs a route even where this spec does
      // not care about one. No parameters: the default is "nobody said where they came from".
      { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } },FormBuilder, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()],
    })
      .overrideTemplate(RegisterComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    comp = fixture.componentInstance;
    registerService = TestBed.inject(RegisterService);
    jest.spyOn(registerService, 'checkUsername').mockReturnValue(of({ available: true, suggestions: [] }));
  });

  const type = (login: string): void => {
    comp.registerForm.controls.login.setValue(login);
    comp.registerForm.controls.login.markAsDirty();
  };

  it('marks an available username as valid and offers no suggestions', fakeAsync(() => {
    jest.spyOn(registerService, 'checkUsername').mockReturnValue(of({ available: true, suggestions: [] }));

    type('brand-new');
    tick(USERNAME_CHECK_DEBOUNCE_MS);

    expect(comp.registerForm.controls.login.valid).toBe(true);
    expect(comp.usernameAvailable).toBe(true);
    expect(comp.usernameTaken).toBe(false);
    expect(comp.usernameSuggestions()).toEqual([]);
  }));

  it('marks a taken username invalid, blocking submission, and keeps the suggestions', fakeAsync(() => {
    jest.spyOn(registerService, 'checkUsername').mockReturnValue(of({ available: false, suggestions: ['kojo1', 'kojo2'] }));

    type('kojo');
    tick(USERNAME_CHECK_DEBOUNCE_MS);

    expect(comp.registerForm.controls.login.hasError('usernameTaken')).toBe(true);
    expect(comp.usernameTaken).toBe(true);
    expect(comp.usernameAvailable).toBe(false);
    expect(comp.usernameSuggestions()).toEqual(['kojo1', 'kojo2']);
  }));

  it('asks the gateway once per pause, not once per keystroke', fakeAsync(() => {
    const check = jest.spyOn(registerService, 'checkUsername').mockReturnValue(of({ available: true, suggestions: [] }));

    // Four keystrokes inside the debounce window. Angular unsubscribes the previous validator run on
    // each change, which cancels the pending timer — so only the last one ever reaches the gateway.
    type('k');
    tick(100);
    type('ko');
    tick(100);
    type('koj');
    tick(100);
    type('kojo');
    tick(USERNAME_CHECK_DEBOUNCE_MS);

    expect(check).toHaveBeenCalledTimes(1);
    expect(check).toHaveBeenCalledWith('kojo');
  }));

  it('never asks the gateway about a login registration would reject anyway', fakeAsync(() => {
    const check = jest.spyOn(registerService, 'checkUsername').mockReturnValue(of({ available: true, suggestions: [] }));

    // Angular runs async validators only once the synchronous ones pass, so the look-ahead cannot be
    // used to probe values that could never be registered.
    type('funky-log(n');
    tick(USERNAME_CHECK_DEBOUNCE_MS);

    expect(check).not.toHaveBeenCalled();
    expect(comp.registerForm.controls.login.hasError('pattern')).toBe(true);
  }));

  it('does not block registration when the look-ahead itself fails', fakeAsync(() => {
    jest
      .spyOn(registerService, 'checkUsername')
      .mockReturnValue(throwError(() => new HttpErrorResponse({ status: 503, statusText: 'Service Unavailable' })));

    type('kojo');
    tick(USERNAME_CHECK_DEBOUNCE_MS);

    // A convenience that cannot reach the gateway must not stand between the user and registering.
    // POST /register still answers authoritatively and has its own error path for a taken login.
    expect(comp.registerForm.controls.login.valid).toBe(true);
    expect(comp.usernameTaken).toBe(false);
    expect(comp.usernameSuggestions()).toEqual([]);
  }));

  it('re-checks the suggestion it puts in the field', fakeAsync(() => {
    const check = jest.spyOn(registerService, 'checkUsername').mockReturnValue(of({ available: false, suggestions: ['kojo1'] }));

    type('kojo');
    tick(USERNAME_CHECK_DEBOUNCE_MS);
    expect(comp.usernameSuggestions()).toEqual(['kojo1']);

    // Nothing reserves a suggestion, so it can be taken between being offered and being clicked.
    check.mockReturnValue(of({ available: true, suggestions: [] }));
    comp.useSuggestion('kojo1');
    tick(USERNAME_CHECK_DEBOUNCE_MS);

    expect(comp.registerForm.controls.login.value).toBe('kojo1');
    expect(check).toHaveBeenLastCalledWith('kojo1');
    expect(comp.usernameAvailable).toBe(true);
  }));

  it('reports the pending state while the gateway is being asked', fakeAsync(() => {
    jest.spyOn(registerService, 'checkUsername').mockReturnValue(of({ available: true, suggestions: [] }));

    type('kojo');
    expect(comp.usernameChecking).toBe(true);

    tick(USERNAME_CHECK_DEBOUNCE_MS);
    expect(comp.usernameChecking).toBe(false);
  }));
});
