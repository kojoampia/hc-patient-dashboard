import { Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { ASC } from 'app/config/navigation.constants';
import { CarePlanItemComponent } from './list/care-plan-item.component';
import { CarePlanItemDetailComponent } from './detail/care-plan-item-detail.component';
import { CarePlanItemUpdateComponent } from './update/care-plan-item-update.component';
import CarePlanItemResolve from './route/care-plan-item-routing-resolve.service';

const carePlanItemRoute: Routes = [
  {
    path: '',
    component: CarePlanItemComponent,
    data: {
      defaultSort: 'id,' + ASC,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    component: CarePlanItemDetailComponent,
    resolve: {
      carePlanItem: CarePlanItemResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    component: CarePlanItemUpdateComponent,
    resolve: {
      carePlanItem: CarePlanItemResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    component: CarePlanItemUpdateComponent,
    resolve: {
      carePlanItem: CarePlanItemResolve,
    },
    canActivate: [UserRouteAccessService],
  },
];

export default carePlanItemRoute;
