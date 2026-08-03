import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { map } from 'rxjs/operators';

import dayjs from 'dayjs/esm';

import { isPresent } from 'app/core/util/operators';
import { DATE_FORMAT } from 'app/config/input.constants';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { ICarePlanItem, NewCarePlanItem } from '../care-plan-item.model';

export type PartialUpdateCarePlanItem = Partial<ICarePlanItem> & Pick<ICarePlanItem, 'id'>;

type RestOf<T extends ICarePlanItem | NewCarePlanItem> = Omit<T, 'createdDate' | 'modifiedDate'> & {
  createdDate?: string | null;
  modifiedDate?: string | null;
};

export type RestCarePlanItem = RestOf<ICarePlanItem>;

export type NewRestCarePlanItem = RestOf<NewCarePlanItem>;

export type PartialUpdateRestCarePlanItem = RestOf<PartialUpdateCarePlanItem>;

export type EntityResponseType = HttpResponse<ICarePlanItem>;
export type EntityArrayResponseType = HttpResponse<ICarePlanItem[]>;

@Injectable({ providedIn: 'root' })
export class CarePlanItemService {
  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/care-plan-items', 'hcpatientservice');

  constructor(
    protected http: HttpClient,
    protected applicationConfigService: ApplicationConfigService,
  ) {}

  create(carePlanItem: NewCarePlanItem): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(carePlanItem);
    return this.http
      .post<RestCarePlanItem>(this.resourceUrl, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  update(carePlanItem: ICarePlanItem): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(carePlanItem);
    return this.http
      .put<RestCarePlanItem>(`${this.resourceUrl}/${this.getCarePlanItemIdentifier(carePlanItem)}`, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  partialUpdate(carePlanItem: PartialUpdateCarePlanItem): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(carePlanItem);
    return this.http
      .patch<RestCarePlanItem>(`${this.resourceUrl}/${this.getCarePlanItemIdentifier(carePlanItem)}`, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  find(id: string): Observable<EntityResponseType> {
    return this.http
      .get<RestCarePlanItem>(`${this.resourceUrl}/${id}`, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http
      .get<RestCarePlanItem[]>(this.resourceUrl, { params: options, observe: 'response' })
      .pipe(map(res => this.convertResponseArrayFromServer(res)));
  }

  delete(id: string): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getCarePlanItemIdentifier(carePlanItem: Pick<ICarePlanItem, 'id'>): string {
    return carePlanItem.id;
  }

  compareCarePlanItem(o1: Pick<ICarePlanItem, 'id'> | null, o2: Pick<ICarePlanItem, 'id'> | null): boolean {
    return o1 && o2 ? this.getCarePlanItemIdentifier(o1) === this.getCarePlanItemIdentifier(o2) : o1 === o2;
  }

  addCarePlanItemToCollectionIfMissing<Type extends Pick<ICarePlanItem, 'id'>>(
    carePlanItemCollection: Type[],
    ...carePlanItemsToCheck: (Type | null | undefined)[]
  ): Type[] {
    const carePlanItems: Type[] = carePlanItemsToCheck.filter(isPresent);
    if (carePlanItems.length > 0) {
      const carePlanItemCollectionIdentifiers = carePlanItemCollection.map(
        carePlanItemItem => this.getCarePlanItemIdentifier(carePlanItemItem)!,
      );
      const carePlanItemsToAdd = carePlanItems.filter(carePlanItemItem => {
        const carePlanItemIdentifier = this.getCarePlanItemIdentifier(carePlanItemItem);
        if (carePlanItemCollectionIdentifiers.includes(carePlanItemIdentifier)) {
          return false;
        }
        carePlanItemCollectionIdentifiers.push(carePlanItemIdentifier);
        return true;
      });
      return [...carePlanItemsToAdd, ...carePlanItemCollection];
    }
    return carePlanItemCollection;
  }

  protected convertDateFromClient<T extends ICarePlanItem | NewCarePlanItem | PartialUpdateCarePlanItem>(carePlanItem: T): RestOf<T> {
    return {
      ...carePlanItem,
      createdDate: carePlanItem.createdDate?.format(DATE_FORMAT) ?? null,
      modifiedDate: carePlanItem.modifiedDate?.format(DATE_FORMAT) ?? null,
    };
  }

  protected convertDateFromServer(restCarePlanItem: RestCarePlanItem): ICarePlanItem {
    return {
      ...restCarePlanItem,
      createdDate: restCarePlanItem.createdDate ? dayjs(restCarePlanItem.createdDate) : undefined,
      modifiedDate: restCarePlanItem.modifiedDate ? dayjs(restCarePlanItem.modifiedDate) : undefined,
    };
  }

  protected convertResponseFromServer(res: HttpResponse<RestCarePlanItem>): HttpResponse<ICarePlanItem> {
    return res.clone({
      body: res.body ? this.convertDateFromServer(res.body) : null,
    });
  }

  protected convertResponseArrayFromServer(res: HttpResponse<RestCarePlanItem[]>): HttpResponse<ICarePlanItem[]> {
    return res.clone({
      body: res.body ? res.body.map(item => this.convertDateFromServer(item)) : null,
    });
  }
}
