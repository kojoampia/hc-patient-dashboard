import { inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { of, EMPTY, Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { IAllergy } from '../allergy.model';
import { AllergyService } from '../service/allergy.service';

export const allergyResolve = (route: ActivatedRouteSnapshot): Observable<null | IAllergy> => {
  const id = route.params['id'];
  if (id) {
    return inject(AllergyService)
      .find(id)
      .pipe(
        mergeMap((allergy: HttpResponse<IAllergy>) => {
          if (allergy.body) {
            return of(allergy.body);
          } else {
            inject(Router).navigate(['404']);
            return EMPTY;
          }
        }),
      );
  }
  return of(null);
};

export default allergyResolve;
