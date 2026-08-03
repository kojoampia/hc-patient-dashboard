import { inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { of, EMPTY, Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { IRecommendation } from '../recommendation.model';
import { RecommendationService } from '../service/recommendation.service';

export const recommendationResolve = (route: ActivatedRouteSnapshot): Observable<null | IRecommendation> => {
  const id = route.params['id'];
  if (id) {
    return inject(RecommendationService)
      .find(id)
      .pipe(
        mergeMap((recommendation: HttpResponse<IRecommendation>) => {
          if (recommendation.body) {
            return of(recommendation.body);
          } else {
            inject(Router).navigate(['404']);
            return EMPTY;
          }
        }),
      );
  }
  return of(null);
};

export default recommendationResolve;
