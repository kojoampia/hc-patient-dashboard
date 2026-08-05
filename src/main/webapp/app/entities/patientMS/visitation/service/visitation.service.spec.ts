import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { DATE_FORMAT } from 'app/config/input.constants';
import { IVisitation } from '../visitation.model';
import { sampleWithRequiredData, sampleWithNewData, sampleWithPartialData, sampleWithFullData } from '../visitation.test-samples';

import { VisitationService, RestVisitation } from './visitation.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

const requireRestSample: RestVisitation = {
  ...sampleWithRequiredData,
  visitedAt: sampleWithRequiredData.visitedAt?.toJSON(),
  createdDate: sampleWithRequiredData.createdDate?.format(DATE_FORMAT),
  modifiedDate: sampleWithRequiredData.modifiedDate?.format(DATE_FORMAT),
};

describe('Visitation Service', () => {
  let service: VisitationService;
  let httpMock: HttpTestingController;
  let expectedResult: IVisitation | IVisitation[] | boolean | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
});
    expectedResult = null;
    service = TestBed.inject(VisitationService);
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

    it('should create a Visitation', () => {
      const visitation = { ...sampleWithNewData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.create(visitation).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'POST' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should update a Visitation', () => {
      const visitation = { ...sampleWithRequiredData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.update(visitation).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PUT' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should partial update a Visitation', () => {
      const patchObject = { ...sampleWithPartialData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.partialUpdate(patchObject).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PATCH' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should return a list of Visitation', () => {
      const returnedFromService = { ...requireRestSample };

      const expected = { ...sampleWithRequiredData };

      service.query().subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush([returnedFromService]);
      httpMock.verify();
      expect(expectedResult).toMatchObject([expected]);
    });

    it('should delete a Visitation', () => {
      const expected = true;

      service.delete('ABC').subscribe(resp => (expectedResult = resp.ok));

      const req = httpMock.expectOne({ method: 'DELETE' });
      req.flush({ status: 200 });
      expect(expectedResult).toBe(expected);
    });

    describe('addVisitationToCollectionIfMissing', () => {
      it('should add a Visitation to an empty array', () => {
        const visitation: IVisitation = sampleWithRequiredData;
        expectedResult = service.addVisitationToCollectionIfMissing([], visitation);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(visitation);
      });

      it('should not add a Visitation to an array that contains it', () => {
        const visitation: IVisitation = sampleWithRequiredData;
        const visitationCollection: IVisitation[] = [
          {
            ...visitation,
          },
          sampleWithPartialData,
        ];
        expectedResult = service.addVisitationToCollectionIfMissing(visitationCollection, visitation);
        expect(expectedResult).toHaveLength(2);
      });

      it("should add a Visitation to an array that doesn't contain it", () => {
        const visitation: IVisitation = sampleWithRequiredData;
        const visitationCollection: IVisitation[] = [sampleWithPartialData];
        expectedResult = service.addVisitationToCollectionIfMissing(visitationCollection, visitation);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(visitation);
      });

      it('should add only unique Visitation to an array', () => {
        const visitationArray: IVisitation[] = [sampleWithRequiredData, sampleWithPartialData, sampleWithFullData];
        const visitationCollection: IVisitation[] = [sampleWithRequiredData];
        expectedResult = service.addVisitationToCollectionIfMissing(visitationCollection, ...visitationArray);
        expect(expectedResult).toHaveLength(3);
      });

      it('should accept varargs', () => {
        const visitation: IVisitation = sampleWithRequiredData;
        const visitation2: IVisitation = sampleWithPartialData;
        expectedResult = service.addVisitationToCollectionIfMissing([], visitation, visitation2);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(visitation);
        expect(expectedResult).toContain(visitation2);
      });

      it('should accept null and undefined values', () => {
        const visitation: IVisitation = sampleWithRequiredData;
        expectedResult = service.addVisitationToCollectionIfMissing([], null, visitation, undefined);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(visitation);
      });

      it('should return initial array if no Visitation is added', () => {
        const visitationCollection: IVisitation[] = [sampleWithRequiredData];
        expectedResult = service.addVisitationToCollectionIfMissing(visitationCollection, undefined, null);
        expect(expectedResult).toEqual(visitationCollection);
      });
    });

    describe('compareVisitation', () => {
      it('Should return true if both entities are null', () => {
        const entity1 = null;
        const entity2 = null;

        const compareResult = service.compareVisitation(entity1, entity2);

        expect(compareResult).toEqual(true);
      });

      it('Should return false if one entity is null', () => {
        const entity1 = { id: 'ABC' };
        const entity2 = null;

        const compareResult1 = service.compareVisitation(entity1, entity2);
        const compareResult2 = service.compareVisitation(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey differs', () => {
        const entity1 = { id: 'ABC' };
        const entity2 = { id: 'CBA' };

        const compareResult1 = service.compareVisitation(entity1, entity2);
        const compareResult2 = service.compareVisitation(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey matches', () => {
        const entity1 = { id: 'ABC' };
        const entity2 = { id: 'ABC' };

        const compareResult1 = service.compareVisitation(entity1, entity2);
        const compareResult2 = service.compareVisitation(entity2, entity1);

        expect(compareResult1).toEqual(true);
        expect(compareResult2).toEqual(true);
      });
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
