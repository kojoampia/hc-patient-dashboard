import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { map } from 'rxjs/operators';

import dayjs from 'dayjs/esm';

import { isPresent } from 'app/core/util/operators';
import { DATE_FORMAT } from 'app/config/input.constants';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { IPersonalDocument, NewPersonalDocument } from '../personal-document.model';

export type PartialUpdatePersonalDocument = Partial<IPersonalDocument> & Pick<IPersonalDocument, 'id'>;

type RestOf<T extends IPersonalDocument | NewPersonalDocument> = Omit<T, 'issuedOn' | 'expiresOn'> & {
  issuedOn?: string | null;
  expiresOn?: string | null;
};

export type RestPersonalDocument = RestOf<IPersonalDocument>;

export type NewRestPersonalDocument = RestOf<NewPersonalDocument>;

export type PartialUpdateRestPersonalDocument = RestOf<PartialUpdatePersonalDocument>;

export type EntityResponseType = HttpResponse<IPersonalDocument>;
export type EntityArrayResponseType = HttpResponse<IPersonalDocument[]>;

@Injectable({ providedIn: 'root' })
export class PersonalDocumentService {
  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/personal-documents', 'hcpatientservice');

  constructor(
    protected http: HttpClient,
    protected applicationConfigService: ApplicationConfigService,
  ) {}

  create(personalDocument: NewPersonalDocument): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(personalDocument);
    return this.http
      .post<RestPersonalDocument>(this.resourceUrl, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  update(personalDocument: IPersonalDocument): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(personalDocument);
    return this.http
      .put<RestPersonalDocument>(`${this.resourceUrl}/${this.getPersonalDocumentIdentifier(personalDocument)}`, copy, {
        observe: 'response',
      })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  partialUpdate(personalDocument: PartialUpdatePersonalDocument): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(personalDocument);
    return this.http
      .patch<RestPersonalDocument>(`${this.resourceUrl}/${this.getPersonalDocumentIdentifier(personalDocument)}`, copy, {
        observe: 'response',
      })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  find(id: string): Observable<EntityResponseType> {
    return this.http
      .get<RestPersonalDocument>(`${this.resourceUrl}/${id}`, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http
      .get<RestPersonalDocument[]>(this.resourceUrl, { params: options, observe: 'response' })
      .pipe(map(res => this.convertResponseArrayFromServer(res)));
  }

  delete(id: string): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getPersonalDocumentIdentifier(personalDocument: Pick<IPersonalDocument, 'id'>): string {
    return personalDocument.id;
  }

  comparePersonalDocument(o1: Pick<IPersonalDocument, 'id'> | null, o2: Pick<IPersonalDocument, 'id'> | null): boolean {
    return o1 && o2 ? this.getPersonalDocumentIdentifier(o1) === this.getPersonalDocumentIdentifier(o2) : o1 === o2;
  }

  addPersonalDocumentToCollectionIfMissing<Type extends Pick<IPersonalDocument, 'id'>>(
    personalDocumentCollection: Type[],
    ...personalDocumentsToCheck: (Type | null | undefined)[]
  ): Type[] {
    const personalDocuments: Type[] = personalDocumentsToCheck.filter(isPresent);
    if (personalDocuments.length > 0) {
      const personalDocumentCollectionIdentifiers = personalDocumentCollection.map(
        personalDocumentItem => this.getPersonalDocumentIdentifier(personalDocumentItem)!,
      );
      const personalDocumentsToAdd = personalDocuments.filter(personalDocumentItem => {
        const personalDocumentIdentifier = this.getPersonalDocumentIdentifier(personalDocumentItem);
        if (personalDocumentCollectionIdentifiers.includes(personalDocumentIdentifier)) {
          return false;
        }
        personalDocumentCollectionIdentifiers.push(personalDocumentIdentifier);
        return true;
      });
      return [...personalDocumentsToAdd, ...personalDocumentCollection];
    }
    return personalDocumentCollection;
  }

  protected convertDateFromClient<T extends IPersonalDocument | NewPersonalDocument | PartialUpdatePersonalDocument>(
    personalDocument: T,
  ): RestOf<T> {
    return {
      ...personalDocument,
      issuedOn: personalDocument.issuedOn?.format(DATE_FORMAT) ?? null,
      expiresOn: personalDocument.expiresOn?.format(DATE_FORMAT) ?? null,
    };
  }

  protected convertDateFromServer(restPersonalDocument: RestPersonalDocument): IPersonalDocument {
    return {
      ...restPersonalDocument,
      issuedOn: restPersonalDocument.issuedOn ? dayjs(restPersonalDocument.issuedOn) : undefined,
      expiresOn: restPersonalDocument.expiresOn ? dayjs(restPersonalDocument.expiresOn) : undefined,
    };
  }

  protected convertResponseFromServer(res: HttpResponse<RestPersonalDocument>): HttpResponse<IPersonalDocument> {
    return res.clone({
      body: res.body ? this.convertDateFromServer(res.body) : null,
    });
  }

  protected convertResponseArrayFromServer(res: HttpResponse<RestPersonalDocument[]>): HttpResponse<IPersonalDocument[]> {
    return res.clone({
      body: res.body ? res.body.map(item => this.convertDateFromServer(item)) : null,
    });
  }
}
