import { Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { ASC } from 'app/config/navigation.constants';
import { PersonalDocumentComponent } from './list/personal-document.component';
import { PersonalDocumentDetailComponent } from './detail/personal-document-detail.component';
import { PersonalDocumentUpdateComponent } from './update/personal-document-update.component';
import PersonalDocumentResolve from './route/personal-document-routing-resolve.service';

const personalDocumentRoute: Routes = [
  {
    path: '',
    component: PersonalDocumentComponent,
    data: {
      defaultSort: 'id,' + ASC,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    component: PersonalDocumentDetailComponent,
    resolve: {
      personalDocument: PersonalDocumentResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    component: PersonalDocumentUpdateComponent,
    resolve: {
      personalDocument: PersonalDocumentResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    component: PersonalDocumentUpdateComponent,
    resolve: {
      personalDocument: PersonalDocumentResolve,
    },
    canActivate: [UserRouteAccessService],
  },
];

export default personalDocumentRoute;
