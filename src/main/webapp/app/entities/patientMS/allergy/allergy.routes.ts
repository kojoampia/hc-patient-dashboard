import { Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { ASC } from 'app/config/navigation.constants';
import { AllergyComponent } from './list/allergy.component';
import { AllergyDetailComponent } from './detail/allergy-detail.component';
import { AllergyUpdateComponent } from './update/allergy-update.component';
import AllergyResolve from './route/allergy-routing-resolve.service';

const allergyRoute: Routes = [
  {
    path: '',
    component: AllergyComponent,
    data: {
      defaultSort: 'id,' + ASC,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    component: AllergyDetailComponent,
    resolve: {
      allergy: AllergyResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    component: AllergyUpdateComponent,
    resolve: {
      allergy: AllergyResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    component: AllergyUpdateComponent,
    resolve: {
      allergy: AllergyResolve,
    },
    canActivate: [UserRouteAccessService],
  },
];

export default allergyRoute;
