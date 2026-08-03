import { Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { ASC } from 'app/config/navigation.constants';
import { RecommendationComponent } from './list/recommendation.component';
import { RecommendationDetailComponent } from './detail/recommendation-detail.component';
import { RecommendationUpdateComponent } from './update/recommendation-update.component';
import RecommendationResolve from './route/recommendation-routing-resolve.service';

const recommendationRoute: Routes = [
  {
    path: '',
    component: RecommendationComponent,
    data: {
      defaultSort: 'id,' + ASC,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    component: RecommendationDetailComponent,
    resolve: {
      recommendation: RecommendationResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    component: RecommendationUpdateComponent,
    resolve: {
      recommendation: RecommendationResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    component: RecommendationUpdateComponent,
    resolve: {
      recommendation: RecommendationResolve,
    },
    canActivate: [UserRouteAccessService],
  },
];

export default recommendationRoute;
