import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { IPaymentOption, NewPaymentOption } from '../payment-option.model';

export type PartialUpdatePaymentOption = Partial<IPaymentOption> & Pick<IPaymentOption, 'id'>;

export type EntityResponseType = HttpResponse<IPaymentOption>;
export type EntityArrayResponseType = HttpResponse<IPaymentOption[]>;

@Injectable({ providedIn: 'root' })
export class PaymentOptionService {
  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/payment-options', 'hcpatientservice');

  constructor(
    protected http: HttpClient,
    protected applicationConfigService: ApplicationConfigService,
  ) {}

  create(paymentOption: NewPaymentOption): Observable<EntityResponseType> {
    return this.http.post<IPaymentOption>(this.resourceUrl, paymentOption, { observe: 'response' });
  }

  update(paymentOption: IPaymentOption): Observable<EntityResponseType> {
    return this.http.put<IPaymentOption>(`${this.resourceUrl}/${this.getPaymentOptionIdentifier(paymentOption)}`, paymentOption, {
      observe: 'response',
    });
  }

  partialUpdate(paymentOption: PartialUpdatePaymentOption): Observable<EntityResponseType> {
    return this.http.patch<IPaymentOption>(`${this.resourceUrl}/${this.getPaymentOptionIdentifier(paymentOption)}`, paymentOption, {
      observe: 'response',
    });
  }

  find(id: string): Observable<EntityResponseType> {
    return this.http.get<IPaymentOption>(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http.get<IPaymentOption[]>(this.resourceUrl, { params: options, observe: 'response' });
  }

  delete(id: string): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getPaymentOptionIdentifier(paymentOption: Pick<IPaymentOption, 'id'>): string {
    return paymentOption.id;
  }

  comparePaymentOption(o1: Pick<IPaymentOption, 'id'> | null, o2: Pick<IPaymentOption, 'id'> | null): boolean {
    return o1 && o2 ? this.getPaymentOptionIdentifier(o1) === this.getPaymentOptionIdentifier(o2) : o1 === o2;
  }

  addPaymentOptionToCollectionIfMissing<Type extends Pick<IPaymentOption, 'id'>>(
    paymentOptionCollection: Type[],
    ...paymentOptionsToCheck: (Type | null | undefined)[]
  ): Type[] {
    const paymentOptions: Type[] = paymentOptionsToCheck.filter(isPresent);
    if (paymentOptions.length > 0) {
      const paymentOptionCollectionIdentifiers = paymentOptionCollection.map(
        paymentOptionItem => this.getPaymentOptionIdentifier(paymentOptionItem)!,
      );
      const paymentOptionsToAdd = paymentOptions.filter(paymentOptionItem => {
        const paymentOptionIdentifier = this.getPaymentOptionIdentifier(paymentOptionItem);
        if (paymentOptionCollectionIdentifiers.includes(paymentOptionIdentifier)) {
          return false;
        }
        paymentOptionCollectionIdentifiers.push(paymentOptionIdentifier);
        return true;
      });
      return [...paymentOptionsToAdd, ...paymentOptionCollection];
    }
    return paymentOptionCollection;
  }
}
