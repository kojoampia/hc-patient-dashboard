import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { Registration } from './register.model';
import { UsernameAvailability } from './username-availability.model';

@Injectable({ providedIn: 'root' })
export class RegisterService {
  constructor(
    private http: HttpClient,
    private applicationConfigService: ApplicationConfigService,
  ) {}

  save(registration: Registration): Observable<{}> {
    return this.http.post(this.applicationConfigService.getEndpointFor('api/register'), registration);
  }

  /**
   * Asks whether `login` can be registered, and what else is free if it cannot.
   *
   * POST rather than GET, matching the gateway: this fires as the user types, and a query string is
   * written to the host nginx access log on every request, so a GET would accumulate a log of
   * half-typed candidate usernames belonging to people who never finished registering.
   */
  checkUsername(login: string): Observable<UsernameAvailability> {
    return this.http.post<UsernameAvailability>(this.applicationConfigService.getEndpointFor('api/account/username-available'), {
      login,
    });
  }
}
