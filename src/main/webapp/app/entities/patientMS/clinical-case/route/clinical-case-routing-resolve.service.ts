import { inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { of, EMPTY, Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { IClinicalCase } from '../clinical-case.model';
import { ClinicalCaseService } from '../service/clinical-case.service';

export const clinicalCaseResolve = (route: ActivatedRouteSnapshot): Observable<null | IClinicalCase> => {
  const id = route.params['id'];
  if (id) {
    return inject(ClinicalCaseService)
      .find(id)
      .pipe(
        mergeMap((clinicalCase: HttpResponse<IClinicalCase>) => {
          if (clinicalCase.body) {
            return of(clinicalCase.body);
          } else {
            inject(Router).navigate(['404']);
            return EMPTY;
          }
        }),
      );
  }
  return of(null);
};

export default clinicalCaseResolve;
