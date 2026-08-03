import { Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { ASC } from 'app/config/navigation.constants';
import { ProfessionalComponent } from './list/professional.component';
import { ProfessionalDetailComponent } from './detail/professional-detail.component';
import { ProfessionalUpdateComponent } from './update/professional-update.component';
import ProfessionalResolve from './route/professional-routing-resolve.service';

const professionalRoute: Routes = [
  {
    path: '',
    component: ProfessionalComponent,
    data: {
      defaultSort: 'id,' + ASC,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    component: ProfessionalDetailComponent,
    resolve: {
      professional: ProfessionalResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    component: ProfessionalUpdateComponent,
    resolve: {
      professional: ProfessionalResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    component: ProfessionalUpdateComponent,
    resolve: {
      professional: ProfessionalResolve,
    },
    canActivate: [UserRouteAccessService],
  },
];

export default professionalRoute;
