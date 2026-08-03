import { inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { of, EMPTY, Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { ICarePlanItem } from '../care-plan-item.model';
import { CarePlanItemService } from '../service/care-plan-item.service';

export const carePlanItemResolve = (route: ActivatedRouteSnapshot): Observable<null | ICarePlanItem> => {
  const id = route.params['id'];
  if (id) {
    return inject(CarePlanItemService)
      .find(id)
      .pipe(
        mergeMap((carePlanItem: HttpResponse<ICarePlanItem>) => {
          if (carePlanItem.body) {
            return of(carePlanItem.body);
          } else {
            inject(Router).navigate(['404']);
            return EMPTY;
          }
        }),
      );
  }
  return of(null);
};

export default carePlanItemResolve;
