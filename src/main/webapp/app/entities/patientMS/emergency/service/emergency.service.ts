import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { map } from 'rxjs/operators';

import dayjs from 'dayjs/esm';

import { isPresent } from 'app/core/util/operators';
import { DATE_FORMAT } from 'app/config/input.constants';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { IEmergency, NewEmergency } from '../emergency.model';

export type PartialUpdateEmergency = Partial<IEmergency> & Pick<IEmergency, 'id'>;

type RestOf<T extends IEmergency | NewEmergency> = Omit<T, 'raisedAt' | 'resolvedAt' | 'createdDate' | 'modifiedDate'> & {
  raisedAt?: string | null;
  resolvedAt?: string | null;
  createdDate?: string | null;
  modifiedDate?: string | null;
};

export type RestEmergency = RestOf<IEmergency>;

export type NewRestEmergency = RestOf<NewEmergency>;

export type PartialUpdateRestEmergency = RestOf<PartialUpdateEmergency>;

export type EntityResponseType = HttpResponse<IEmergency>;
export type EntityArrayResponseType = HttpResponse<IEmergency[]>;

@Injectable({ providedIn: 'root' })
export class EmergencyService {
  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/emergencies', 'hcpatientservice');

  constructor(
    protected http: HttpClient,
    protected applicationConfigService: ApplicationConfigService,
  ) {}

  create(emergency: NewEmergency): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(emergency);
    return this.http
      .post<RestEmergency>(this.resourceUrl, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  update(emergency: IEmergency): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(emergency);
    return this.http
      .put<RestEmergency>(`${this.resourceUrl}/${this.getEmergencyIdentifier(emergency)}`, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  partialUpdate(emergency: PartialUpdateEmergency): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(emergency);
    return this.http
      .patch<RestEmergency>(`${this.resourceUrl}/${this.getEmergencyIdentifier(emergency)}`, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  find(id: string): Observable<EntityResponseType> {
    return this.http
      .get<RestEmergency>(`${this.resourceUrl}/${id}`, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http
      .get<RestEmergency[]>(this.resourceUrl, { params: options, observe: 'response' })
      .pipe(map(res => this.convertResponseArrayFromServer(res)));
  }

  delete(id: string): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getEmergencyIdentifier(emergency: Pick<IEmergency, 'id'>): string {
    return emergency.id;
  }

  compareEmergency(o1: Pick<IEmergency, 'id'> | null, o2: Pick<IEmergency, 'id'> | null): boolean {
    return o1 && o2 ? this.getEmergencyIdentifier(o1) === this.getEmergencyIdentifier(o2) : o1 === o2;
  }

  addEmergencyToCollectionIfMissing<Type extends Pick<IEmergency, 'id'>>(
    emergencyCollection: Type[],
    ...emergenciesToCheck: (Type | null | undefined)[]
  ): Type[] {
    const emergencies: Type[] = emergenciesToCheck.filter(isPresent);
    if (emergencies.length > 0) {
      const emergencyCollectionIdentifiers = emergencyCollection.map(emergencyItem => this.getEmergencyIdentifier(emergencyItem)!);
      const emergenciesToAdd = emergencies.filter(emergencyItem => {
        const emergencyIdentifier = this.getEmergencyIdentifier(emergencyItem);
        if (emergencyCollectionIdentifiers.includes(emergencyIdentifier)) {
          return false;
        }
        emergencyCollectionIdentifiers.push(emergencyIdentifier);
        return true;
      });
      return [...emergenciesToAdd, ...emergencyCollection];
    }
    return emergencyCollection;
  }

  protected convertDateFromClient<T extends IEmergency | NewEmergency | PartialUpdateEmergency>(emergency: T): RestOf<T> {
    return {
      ...emergency,
      raisedAt: emergency.raisedAt?.toJSON() ?? null,
      resolvedAt: emergency.resolvedAt?.toJSON() ?? null,
      createdDate: emergency.createdDate?.format(DATE_FORMAT) ?? null,
      modifiedDate: emergency.modifiedDate?.format(DATE_FORMAT) ?? null,
    };
  }

  protected convertDateFromServer(restEmergency: RestEmergency): IEmergency {
    return {
      ...restEmergency,
      raisedAt: restEmergency.raisedAt ? dayjs(restEmergency.raisedAt) : undefined,
      resolvedAt: restEmergency.resolvedAt ? dayjs(restEmergency.resolvedAt) : undefined,
      createdDate: restEmergency.createdDate ? dayjs(restEmergency.createdDate) : undefined,
      modifiedDate: restEmergency.modifiedDate ? dayjs(restEmergency.modifiedDate) : undefined,
    };
  }

  protected convertResponseFromServer(res: HttpResponse<RestEmergency>): HttpResponse<IEmergency> {
    return res.clone({
      body: res.body ? this.convertDateFromServer(res.body) : null,
    });
  }

  protected convertResponseArrayFromServer(res: HttpResponse<RestEmergency[]>): HttpResponse<IEmergency[]> {
    return res.clone({
      body: res.body ? res.body.map(item => this.convertDateFromServer(item)) : null,
    });
  }
}
