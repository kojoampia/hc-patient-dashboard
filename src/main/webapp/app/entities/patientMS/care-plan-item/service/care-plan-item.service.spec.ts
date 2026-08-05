import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { DATE_FORMAT } from 'app/config/input.constants';
import { ICarePlanItem } from '../care-plan-item.model';
import { sampleWithRequiredData, sampleWithNewData, sampleWithPartialData, sampleWithFullData } from '../care-plan-item.test-samples';

import { CarePlanItemService, RestCarePlanItem } from './care-plan-item.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

const requireRestSample: RestCarePlanItem = {
  ...sampleWithRequiredData,
  createdDate: sampleWithRequiredData.createdDate?.format(DATE_FORMAT),
  modifiedDate: sampleWithRequiredData.modifiedDate?.format(DATE_FORMAT),
};

describe('CarePlanItem Service', () => {
  let service: CarePlanItemService;
  let httpMock: HttpTestingController;
  let expectedResult: ICarePlanItem | ICarePlanItem[] | boolean | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
});
    expectedResult = null;
    service = TestBed.inject(CarePlanItemService);
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

    it('should create a CarePlanItem', () => {
      const carePlanItem = { ...sampleWithNewData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.create(carePlanItem).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'POST' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should update a CarePlanItem', () => {
      const carePlanItem = { ...sampleWithRequiredData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.update(carePlanItem).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PUT' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should partial update a CarePlanItem', () => {
      const patchObject = { ...sampleWithPartialData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.partialUpdate(patchObject).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PATCH' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should return a list of CarePlanItem', () => {
      const returnedFromService = { ...requireRestSample };

      const expected = { ...sampleWithRequiredData };

      service.query().subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush([returnedFromService]);
      httpMock.verify();
      expect(expectedResult).toMatchObject([expected]);
    });

    it('should delete a CarePlanItem', () => {
      const expected = true;

      service.delete('ABC').subscribe(resp => (expectedResult = resp.ok));

      const req = httpMock.expectOne({ method: 'DELETE' });
      req.flush({ status: 200 });
      expect(expectedResult).toBe(expected);
    });

    describe('addCarePlanItemToCollectionIfMissing', () => {
      it('should add a CarePlanItem to an empty array', () => {
        const carePlanItem: ICarePlanItem = sampleWithRequiredData;
        expectedResult = service.addCarePlanItemToCollectionIfMissing([], carePlanItem);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(carePlanItem);
      });

      it('should not add a CarePlanItem to an array that contains it', () => {
        const carePlanItem: ICarePlanItem = sampleWithRequiredData;
        const carePlanItemCollection: ICarePlanItem[] = [
          {
            ...carePlanItem,
          },
          sampleWithPartialData,
        ];
        expectedResult = service.addCarePlanItemToCollectionIfMissing(carePlanItemCollection, carePlanItem);
        expect(expectedResult).toHaveLength(2);
      });

      it("should add a CarePlanItem to an array that doesn't contain it", () => {
        const carePlanItem: ICarePlanItem = sampleWithRequiredData;
        const carePlanItemCollection: ICarePlanItem[] = [sampleWithPartialData];
        expectedResult = service.addCarePlanItemToCollectionIfMissing(carePlanItemCollection, carePlanItem);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(carePlanItem);
      });

      it('should add only unique CarePlanItem to an array', () => {
        const carePlanItemArray: ICarePlanItem[] = [sampleWithRequiredData, sampleWithPartialData, sampleWithFullData];
        const carePlanItemCollection: ICarePlanItem[] = [sampleWithRequiredData];
        expectedResult = service.addCarePlanItemToCollectionIfMissing(carePlanItemCollection, ...carePlanItemArray);
        expect(expectedResult).toHaveLength(3);
      });

      it('should accept varargs', () => {
        const carePlanItem: ICarePlanItem = sampleWithRequiredData;
        const carePlanItem2: ICarePlanItem = sampleWithPartialData;
        expectedResult = service.addCarePlanItemToCollectionIfMissing([], carePlanItem, carePlanItem2);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(carePlanItem);
        expect(expectedResult).toContain(carePlanItem2);
      });

      it('should accept null and undefined values', () => {
        const carePlanItem: ICarePlanItem = sampleWithRequiredData;
        expectedResult = service.addCarePlanItemToCollectionIfMissing([], null, carePlanItem, undefined);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(carePlanItem);
      });

      it('should return initial array if no CarePlanItem is added', () => {
        const carePlanItemCollection: ICarePlanItem[] = [sampleWithRequiredData];
        expectedResult = service.addCarePlanItemToCollectionIfMissing(carePlanItemCollection, undefined, null);
        expect(expectedResult).toEqual(carePlanItemCollection);
      });
    });

    describe('compareCarePlanItem', () => {
      it('Should return true if both entities are null', () => {
        const entity1 = null;
        const entity2 = null;

        const compareResult = service.compareCarePlanItem(entity1, entity2);

        expect(compareResult).toEqual(true);
      });

      it('Should return false if one entity is null', () => {
        const entity1 = { id: 'ABC' };
        const entity2 = null;

        const compareResult1 = service.compareCarePlanItem(entity1, entity2);
        const compareResult2 = service.compareCarePlanItem(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey differs', () => {
        const entity1 = { id: 'ABC' };
        const entity2 = { id: 'CBA' };

        const compareResult1 = service.compareCarePlanItem(entity1, entity2);
        const compareResult2 = service.compareCarePlanItem(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey matches', () => {
        const entity1 = { id: 'ABC' };
        const entity2 = { id: 'ABC' };

        const compareResult1 = service.compareCarePlanItem(entity1, entity2);
        const compareResult2 = service.compareCarePlanItem(entity2, entity1);

        expect(compareResult1).toEqual(true);
        expect(compareResult2).toEqual(true);
      });
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
