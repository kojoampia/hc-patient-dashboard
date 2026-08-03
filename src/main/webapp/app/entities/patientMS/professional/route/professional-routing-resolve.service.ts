import { inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { of, EMPTY, Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { IProfessional } from '../professional.model';
import { ProfessionalService } from '../service/professional.service';

export const professionalResolve = (route: ActivatedRouteSnapshot): Observable<null | IProfessional> => {
  const id = route.params['id'];
  if (id) {
    return inject(ProfessionalService)
      .find(id)
      .pipe(
        mergeMap((professional: HttpResponse<IProfessional>) => {
          if (professional.body) {
            return of(professional.body);
          } else {
            inject(Router).navigate(['404']);
            return EMPTY;
          }
        }),
      );
  }
  return of(null);
};

export default professionalResolve;
