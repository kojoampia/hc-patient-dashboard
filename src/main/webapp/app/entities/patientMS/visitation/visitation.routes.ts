import { Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { ASC } from 'app/config/navigation.constants';
import { VisitationComponent } from './list/visitation.component';
import { VisitationDetailComponent } from './detail/visitation-detail.component';
import { VisitationUpdateComponent } from './update/visitation-update.component';
import VisitationResolve from './route/visitation-routing-resolve.service';

const visitationRoute: Routes = [
  {
    path: '',
    component: VisitationComponent,
    data: {
      defaultSort: 'id,' + ASC,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    component: VisitationDetailComponent,
    resolve: {
      visitation: VisitationResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    component: VisitationUpdateComponent,
    resolve: {
      visitation: VisitationResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    component: VisitationUpdateComponent,
    resolve: {
      visitation: VisitationResolve,
    },
    canActivate: [UserRouteAccessService],
  },
];

export default visitationRoute;
