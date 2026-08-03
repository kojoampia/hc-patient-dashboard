import { Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { ASC } from 'app/config/navigation.constants';
import { EmergencyComponent } from './list/emergency.component';
import { EmergencyDetailComponent } from './detail/emergency-detail.component';
import { EmergencyUpdateComponent } from './update/emergency-update.component';
import EmergencyResolve from './route/emergency-routing-resolve.service';

const emergencyRoute: Routes = [
  {
    path: '',
    component: EmergencyComponent,
    data: {
      defaultSort: 'id,' + ASC,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    component: EmergencyDetailComponent,
    resolve: {
      emergency: EmergencyResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    component: EmergencyUpdateComponent,
    resolve: {
      emergency: EmergencyResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    component: EmergencyUpdateComponent,
    resolve: {
      emergency: EmergencyResolve,
    },
    canActivate: [UserRouteAccessService],
  },
];

export default emergencyRoute;
