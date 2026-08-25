import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { RegisterService } from './register.service';
import { Registration } from './register.model';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('RegisterService Service', () => {
  let service: RegisterService;
  let httpMock: HttpTestingController;
  let applicationConfigService: ApplicationConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
});

    service = TestBed.inject(RegisterService);
    applicationConfigService = TestBed.inject(ApplicationConfigService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Service methods', () => {
    it('should post the candidate login to the availability endpoint', () => {
      // POST, not GET: a query string would put half-typed candidate usernames into the host nginx
      // access log for people who never finish registering.
      let result: unknown;
      service.checkUsername('kojo').subscribe(response => (result = response));

      const testRequest = httpMock.expectOne({
        method: 'POST',
        url: applicationConfigService.getEndpointFor('api/account/username-available'),
      });
      expect(testRequest.request.body).toEqual({ login: 'kojo' });

      testRequest.flush({ available: false, suggestions: ['kojo1', 'kojo2'] });
      expect(result).toEqual({ available: false, suggestions: ['kojo1', 'kojo2'] });
    });

    it('should call register endpoint with correct values', () => {
      // GIVEN
      const login = 'abc';
      const email = 'test@test.com';
      const password = 'pass';
      const langKey = 'FR';
      const registration = new Registration(login, email, password, langKey);

      // WHEN
      service.save(registration).subscribe();

      const testRequest = httpMock.expectOne({
        method: 'POST',
        url: applicationConfigService.getEndpointFor('api/register'),
      });

      // THEN
      // source is part of the posted body now: null when nobody said where the family came from, which the
      // gateway stores as-is rather than defaulting.
      expect(testRequest.request.body).toEqual({ email, langKey, login, password, source: null });
    });
  });
});
