import { Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { ASC } from 'app/config/navigation.constants';
import { ClinicalCaseComponent } from './list/clinical-case.component';
import { ClinicalCaseDetailComponent } from './detail/clinical-case-detail.component';
import { ClinicalCaseUpdateComponent } from './update/clinical-case-update.component';
import ClinicalCaseResolve from './route/clinical-case-routing-resolve.service';

const clinicalCaseRoute: Routes = [
  {
    path: '',
    component: ClinicalCaseComponent,
    data: {
      defaultSort: 'id,' + ASC,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    component: ClinicalCaseDetailComponent,
    resolve: {
      clinicalCase: ClinicalCaseResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    component: ClinicalCaseUpdateComponent,
    resolve: {
      clinicalCase: ClinicalCaseResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    component: ClinicalCaseUpdateComponent,
    resolve: {
      clinicalCase: ClinicalCaseResolve,
    },
    canActivate: [UserRouteAccessService],
  },
];

export default clinicalCaseRoute;
