import { inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { of, EMPTY, Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { IVisitation } from '../visitation.model';
import { VisitationService } from '../service/visitation.service';

export const visitationResolve = (route: ActivatedRouteSnapshot): Observable<null | IVisitation> => {
  const id = route.params['id'];
  if (id) {
    return inject(VisitationService)
      .find(id)
      .pipe(
        mergeMap((visitation: HttpResponse<IVisitation>) => {
          if (visitation.body) {
            return of(visitation.body);
          } else {
            inject(Router).navigate(['404']);
            return EMPTY;
          }
        }),
      );
  }
  return of(null);
};

export default visitationResolve;
