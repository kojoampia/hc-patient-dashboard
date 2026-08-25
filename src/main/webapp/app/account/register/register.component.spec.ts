import { ComponentFixture, TestBed, waitForAsync, inject, tick, fakeAsync } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { EMAIL_ALREADY_USED_TYPE, LOGIN_ALREADY_USED_TYPE } from 'app/config/error.constants';

import { RegisterService } from './register.service';
import RegisterComponent from './register.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ActivatedRoute, convertToParamMap } from '@angular/router';

describe('RegisterComponent', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let comp: RegisterComponent;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [TranslateModule.forRoot(), RegisterComponent],
    providers: [
      FormBuilder,
      provideHttpClient(withInterceptorsFromDi()),
      provideHttpClientTesting(),
      {
        provide: ActivatedRoute,
        // A getter, not a value: the component reads the query string when it is constructed, so the stub has to
        // answer with whatever the test set a moment ago rather than with whatever was there at configure time.
        useValue: { snapshot: { get queryParamMap() { return convertToParamMap(queryParams); } } },
      },
    ]
})
      .overrideTemplate(RegisterComponent, '')
      .compileComponents();
  }));

  /** Rewritten per test, because the handoff parameters arrive on the URL and nowhere else. */
  let queryParams: Record<string, string> = {};

  beforeEach(() => {
    queryParams = {};
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RegisterComponent);
    comp = fixture.componentInstance;
  });

  it('should ensure the two passwords entered match', () => {
    comp.registerForm.patchValue({
      password: 'password',
      confirmPassword: 'non-matching',
    });

    comp.register();

    expect(comp.doNotMatch()).toBe(true);
  });

  it('should update success to true after creating an account', inject(
    [RegisterService, TranslateService],
    fakeAsync((service: RegisterService, mockTranslateService: TranslateService) => {
      jest.spyOn(service, 'save').mockReturnValue(of({}));
      mockTranslateService.currentLang = 'en';
      comp.registerForm.patchValue({
        password: 'password',
        confirmPassword: 'password',
      });

      comp.register();
      tick();

      expect(service.save).toHaveBeenCalledWith({
        email: '',
        password: 'password',
        login: '',
        langKey: 'en',
        // Null and not absent: a registration nobody attributed says so explicitly. A defaulted source would be
        // a fact nobody stated, and indistinguishable in the data from a family who really did arrive that way.
        source: null,
      });
      expect(comp.success()).toBe(true);
      expect(comp.errorUserExists()).toBe(false);
      expect(comp.errorEmailExists()).toBe(false);
      expect(comp.error()).toBe(false);
    }),
  ));

  it('should notify of user existence upon 400/login already in use', inject(
    [RegisterService],
    fakeAsync((service: RegisterService) => {
      jest.spyOn(service, 'save').mockReturnValue(
        throwError({
          status: 400,
          error: { type: LOGIN_ALREADY_USED_TYPE },
        }),
      );
      comp.registerForm.patchValue({
        password: 'password',
        confirmPassword: 'password',
      });

      comp.register();
      tick();

      expect(comp.errorUserExists()).toBe(true);
      expect(comp.errorEmailExists()).toBe(false);
      expect(comp.error()).toBe(false);
    }),
  ));

  it('should notify of email existence upon 400/email address already in use', inject(
    [RegisterService],
    fakeAsync((service: RegisterService) => {
      jest.spyOn(service, 'save').mockReturnValue(
        throwError({
          status: 400,
          error: { type: EMAIL_ALREADY_USED_TYPE },
        }),
      );
      comp.registerForm.patchValue({
        password: 'password',
        confirmPassword: 'password',
      });

      comp.register();
      tick();

      expect(comp.errorEmailExists()).toBe(true);
      expect(comp.errorUserExists()).toBe(false);
      expect(comp.error()).toBe(false);
    }),
  ));

  it('should notify of generic error', inject(
    [RegisterService],
    fakeAsync((service: RegisterService) => {
      jest.spyOn(service, 'save').mockReturnValue(
        throwError({
          status: 503,
        }),
      );
      comp.registerForm.patchValue({
        password: 'password',
        confirmPassword: 'password',
      });

      comp.register();
      tick();

      expect(comp.errorUserExists()).toBe(false);
      expect(comp.errorEmailExists()).toBe(false);
      expect(comp.error()).toBe(true);
    }),
  ));

  describe('the handoff parameters from web.abofonsa.com', () => {
    /**
     * The component reads the query string once, in ngOnInit, so each case needs its own instance — built from the
     * suite's own TestBed rather than a fresh one, because resetting it mid-suite tears down the outer setup and
     * takes unrelated tests with it.
     */
    const startWith = (params: Record<string, string>): RegisterComponent => {
      queryParams = params;
      const created = TestBed.createComponent(RegisterComponent);
      created.detectChanges();
      return created.componentInstance;
    };

    it('starts the form in the language the family was reading', () => {
      startWith({ locale: 'fr' });
      expect(TestBed.inject(TranslateService).currentLang).toBe('fr');
    });

    it('leaves the language alone when the locale is one we do not serve', () => {
      // The contract sends es, de, fr and en; this app serves three of those. An unsupported locale must be
      // ignored rather than attempted.
      const translate = TestBed.inject(TranslateService);
      const before = translate.currentLang;
      startWith({ locale: 'es' });
      expect(TestBed.inject(TranslateService).currentLang).toBe(before);
    });

    it('survives a mangled query string rather than erroring', () => {
      // People bookmark and share these links, and a broken parameter must never cost somebody a working
      // registration form. Every one of these lands on a usable form.
      expect(() => startWith({ locale: 'not-a-locale' })).not.toThrow();
      expect(() => startWith({ locale: '' })).not.toThrow();
      expect(() => startWith({})).not.toThrow();
      expect(() => startWith({ src: '<script>' })).not.toThrow();
    });

    it('sends a recognised source to the gateway and never an unrecognised one', () => {
      const withSource = startWith({ src: 'web-home' });
      expect(withSource['source']).toBe('web-home');

      const withJunk = startWith({ src: 'made-up-campaign' });
      expect(withJunk['source']).toBeNull();
    });
  });
});
