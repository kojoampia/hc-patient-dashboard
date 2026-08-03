import { Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { ASC } from 'app/config/navigation.constants';
import { ActivityLogComponent } from './list/activity-log.component';
import { ActivityLogDetailComponent } from './detail/activity-log-detail.component';
import { ActivityLogUpdateComponent } from './update/activity-log-update.component';
import ActivityLogResolve from './route/activity-log-routing-resolve.service';

const activityLogRoute: Routes = [
  {
    path: '',
    component: ActivityLogComponent,
    data: {
      defaultSort: 'id,' + ASC,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    component: ActivityLogDetailComponent,
    resolve: {
      activityLog: ActivityLogResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    component: ActivityLogUpdateComponent,
    resolve: {
      activityLog: ActivityLogResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    component: ActivityLogUpdateComponent,
    resolve: {
      activityLog: ActivityLogResolve,
    },
    canActivate: [UserRouteAccessService],
  },
];

export default activityLogRoute;
