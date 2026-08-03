import { inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { of, EMPTY, Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { IPersonalDocument } from '../personal-document.model';
import { PersonalDocumentService } from '../service/personal-document.service';

export const personalDocumentResolve = (route: ActivatedRouteSnapshot): Observable<null | IPersonalDocument> => {
  const id = route.params['id'];
  if (id) {
    return inject(PersonalDocumentService)
      .find(id)
      .pipe(
        mergeMap((personalDocument: HttpResponse<IPersonalDocument>) => {
          if (personalDocument.body) {
            return of(personalDocument.body);
          } else {
            inject(Router).navigate(['404']);
            return EMPTY;
          }
        }),
      );
  }
  return of(null);
};

export default personalDocumentResolve;
