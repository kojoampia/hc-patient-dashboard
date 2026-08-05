import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { IRecommendation } from '../recommendation.model';
import { sampleWithRequiredData, sampleWithNewData, sampleWithPartialData, sampleWithFullData } from '../recommendation.test-samples';

import { RecommendationService } from './recommendation.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

const requireRestSample: IRecommendation = {
  ...sampleWithRequiredData,
};

describe('Recommendation Service', () => {
  let service: RecommendationService;
  let httpMock: HttpTestingController;
  let expectedResult: IRecommendation | IRecommendation[] | boolean | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
});
    expectedResult = null;
    service = TestBed.inject(RecommendationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  describe('Service methods', () => {
    it('should find an element', () => {
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.find('ABC').subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should create a Recommendation', () => {
      const recommendation = { ...sampleWithNewData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.create(recommendation).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'POST' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should update a Recommendation', () => {
      const recommendation = { ...sampleWithRequiredData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.update(recommendation).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PUT' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should partial update a Recommendation', () => {
      const patchObject = { ...sampleWithPartialData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.partialUpdate(patchObject).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PATCH' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should return a list of Recommendation', () => {
      const returnedFromService = { ...requireRestSample };

      const expected = { ...sampleWithRequiredData };

      service.query().subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush([returnedFromService]);
      httpMock.verify();
      expect(expectedResult).toMatchObject([expected]);
    });

    it('should delete a Recommendation', () => {
      const expected = true;

      service.delete('ABC').subscribe(resp => (expectedResult = resp.ok));

      const req = httpMock.expectOne({ method: 'DELETE' });
      req.flush({ status: 200 });
      expect(expectedResult).toBe(expected);
    });

    describe('addRecommendationToCollectionIfMissing', () => {
      it('should add a Recommendation to an empty array', () => {
        const recommendation: IRecommendation = sampleWithRequiredData;
        expectedResult = service.addRecommendationToCollectionIfMissing([], recommendation);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(recommendation);
      });

      it('should not add a Recommendation to an array that contains it', () => {
        const recommendation: IRecommendation = sampleWithRequiredData;
        const recommendationCollection: IRecommendation[] = [
          {
            ...recommendation,
          },
          sampleWithPartialData,
        ];
        expectedResult = service.addRecommendationToCollectionIfMissing(recommendationCollection, recommendation);
        expect(expectedResult).toHaveLength(2);
      });

      it("should add a Recommendation to an array that doesn't contain it", () => {
        const recommendation: IRecommendation = sampleWithRequiredData;
        const recommendationCollection: IRecommendation[] = [sampleWithPartialData];
        expectedResult = service.addRecommendationToCollectionIfMissing(recommendationCollection, recommendation);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(recommendation);
      });

      it('should add only unique Recommendation to an array', () => {
        const recommendationArray: IRecommendation[] = [sampleWithRequiredData, sampleWithPartialData, sampleWithFullData];
        const recommendationCollection: IRecommendation[] = [sampleWithRequiredData];
        expectedResult = service.addRecommendationToCollectionIfMissing(recommendationCollection, ...recommendationArray);
        expect(expectedResult).toHaveLength(3);
      });

      it('should accept varargs', () => {
        const recommendation: IRecommendation = sampleWithRequiredData;
        const recommendation2: IRecommendation = sampleWithPartialData;
        expectedResult = service.addRecommendationToCollectionIfMissing([], recommendation, recommendation2);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(recommendation);
        expect(expectedResult).toContain(recommendation2);
      });

      it('should accept null and undefined values', () => {
        const recommendation: IRecommendation = sampleWithRequiredData;
        expectedResult = service.addRecommendationToCollectionIfMissing([], null, recommendation, undefined);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(recommendation);
      });

      it('should return initial array if no Recommendation is added', () => {
        const recommendationCollection: IRecommendation[] = [sampleWithRequiredData];
        expectedResult = service.addRecommendationToCollectionIfMissing(recommendationCollection, undefined, null);
        expect(expectedResult).toEqual(recommendationCollection);
      });
    });

    describe('compareRecommendation', () => {
      it('Should return true if both entities are null', () => {
        const entity1 = null;
        const entity2 = null;

        const compareResult = service.compareRecommendation(entity1, entity2);

        expect(compareResult).toEqual(true);
      });

      it('Should return false if one entity is null', () => {
        const entity1 = { id: 'ABC' };
        const entity2 = null;

        const compareResult1 = service.compareRecommendation(entity1, entity2);
        const compareResult2 = service.compareRecommendation(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey differs', () => {
        const entity1 = { id: 'ABC' };
        const entity2 = { id: 'CBA' };

        const compareResult1 = service.compareRecommendation(entity1, entity2);
        const compareResult2 = service.compareRecommendation(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey matches', () => {
        const entity1 = { id: 'ABC' };
        const entity2 = { id: 'ABC' };

        const compareResult1 = service.compareRecommendation(entity1, entity2);
        const compareResult2 = service.compareRecommendation(entity2, entity1);

        expect(compareResult1).toEqual(true);
        expect(compareResult2).toEqual(true);
      });
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
