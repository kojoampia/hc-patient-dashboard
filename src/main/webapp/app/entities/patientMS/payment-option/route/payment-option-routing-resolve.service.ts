import { inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { of, EMPTY, Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { IPaymentOption } from '../payment-option.model';
import { PaymentOptionService } from '../service/payment-option.service';

export const paymentOptionResolve = (route: ActivatedRouteSnapshot): Observable<null | IPaymentOption> => {
  const id = route.params['id'];
  if (id) {
    return inject(PaymentOptionService)
      .find(id)
      .pipe(
        mergeMap((paymentOption: HttpResponse<IPaymentOption>) => {
          if (paymentOption.body) {
            return of(paymentOption.body);
          } else {
            inject(Router).navigate(['404']);
            return EMPTY;
          }
        }),
      );
  }
  return of(null);
};

export default paymentOptionResolve;
