import { Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { ASC } from 'app/config/navigation.constants';
import { PaymentOptionComponent } from './list/payment-option.component';
import { PaymentOptionDetailComponent } from './detail/payment-option-detail.component';
import { PaymentOptionUpdateComponent } from './update/payment-option-update.component';
import PaymentOptionResolve from './route/payment-option-routing-resolve.service';

const paymentOptionRoute: Routes = [
  {
    path: '',
    component: PaymentOptionComponent,
    data: {
      defaultSort: 'id,' + ASC,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    component: PaymentOptionDetailComponent,
    resolve: {
      paymentOption: PaymentOptionResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    component: PaymentOptionUpdateComponent,
    resolve: {
      paymentOption: PaymentOptionResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    component: PaymentOptionUpdateComponent,
    resolve: {
      paymentOption: PaymentOptionResolve,
    },
    canActivate: [UserRouteAccessService],
  },
];

export default paymentOptionRoute;
