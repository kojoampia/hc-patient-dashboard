import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { IRecommendation, NewRecommendation } from '../recommendation.model';

export type PartialUpdateRecommendation = Partial<IRecommendation> & Pick<IRecommendation, 'id'>;

export type EntityResponseType = HttpResponse<IRecommendation>;
export type EntityArrayResponseType = HttpResponse<IRecommendation[]>;

@Injectable({ providedIn: 'root' })
export class RecommendationService {
  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/recommendations', 'hcpatientservice');

  constructor(
    protected http: HttpClient,
    protected applicationConfigService: ApplicationConfigService,
  ) {}

  create(recommendation: NewRecommendation): Observable<EntityResponseType> {
    return this.http.post<IRecommendation>(this.resourceUrl, recommendation, { observe: 'response' });
  }

  update(recommendation: IRecommendation): Observable<EntityResponseType> {
    return this.http.put<IRecommendation>(`${this.resourceUrl}/${this.getRecommendationIdentifier(recommendation)}`, recommendation, {
      observe: 'response',
    });
  }

  partialUpdate(recommendation: PartialUpdateRecommendation): Observable<EntityResponseType> {
    return this.http.patch<IRecommendation>(`${this.resourceUrl}/${this.getRecommendationIdentifier(recommendation)}`, recommendation, {
      observe: 'response',
    });
  }

  find(id: string): Observable<EntityResponseType> {
    return this.http.get<IRecommendation>(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http.get<IRecommendation[]>(this.resourceUrl, { params: options, observe: 'response' });
  }

  delete(id: string): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getRecommendationIdentifier(recommendation: Pick<IRecommendation, 'id'>): string {
    return recommendation.id;
  }

  compareRecommendation(o1: Pick<IRecommendation, 'id'> | null, o2: Pick<IRecommendation, 'id'> | null): boolean {
    return o1 && o2 ? this.getRecommendationIdentifier(o1) === this.getRecommendationIdentifier(o2) : o1 === o2;
  }

  addRecommendationToCollectionIfMissing<Type extends Pick<IRecommendation, 'id'>>(
    recommendationCollection: Type[],
    ...recommendationsToCheck: (Type | null | undefined)[]
  ): Type[] {
    const recommendations: Type[] = recommendationsToCheck.filter(isPresent);
    if (recommendations.length > 0) {
      const recommendationCollectionIdentifiers = recommendationCollection.map(
        recommendationItem => this.getRecommendationIdentifier(recommendationItem)!,
      );
      const recommendationsToAdd = recommendations.filter(recommendationItem => {
        const recommendationIdentifier = this.getRecommendationIdentifier(recommendationItem);
        if (recommendationCollectionIdentifiers.includes(recommendationIdentifier)) {
          return false;
        }
        recommendationCollectionIdentifiers.push(recommendationIdentifier);
        return true;
      });
      return [...recommendationsToAdd, ...recommendationCollection];
    }
    return recommendationCollection;
  }
}
