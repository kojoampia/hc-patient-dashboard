import { inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { of, EMPTY, Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { IEmergency } from '../emergency.model';
import { EmergencyService } from '../service/emergency.service';

export const emergencyResolve = (route: ActivatedRouteSnapshot): Observable<null | IEmergency> => {
  const id = route.params['id'];
  if (id) {
    return inject(EmergencyService)
      .find(id)
      .pipe(
        mergeMap((emergency: HttpResponse<IEmergency>) => {
          if (emergency.body) {
            return of(emergency.body);
          } else {
            inject(Router).navigate(['404']);
            return EMPTY;
          }
        }),
      );
  }
  return of(null);
};

export default emergencyResolve;
