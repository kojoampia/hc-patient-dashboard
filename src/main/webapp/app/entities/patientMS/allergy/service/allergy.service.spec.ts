import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { DATE_FORMAT } from 'app/config/input.constants';
import { IAllergy } from '../allergy.model';
import { sampleWithRequiredData, sampleWithNewData, sampleWithPartialData, sampleWithFullData } from '../allergy.test-samples';

import { AllergyService, RestAllergy } from './allergy.service';

const requireRestSample: RestAllergy = {
  ...sampleWithRequiredData,
  notedOn: sampleWithRequiredData.notedOn?.format(DATE_FORMAT),
  createdDate: sampleWithRequiredData.createdDate?.format(DATE_FORMAT),
  modifiedDate: sampleWithRequiredData.modifiedDate?.format(DATE_FORMAT),
};

describe('Allergy Service', () => {
  let service: AllergyService;
  let httpMock: HttpTestingController;
  let expectedResult: IAllergy | IAllergy[] | boolean | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    expectedResult = null;
    service = TestBed.inject(AllergyService);
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

    it('should create a Allergy', () => {
      const allergy = { ...sampleWithNewData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.create(allergy).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'POST' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should update a Allergy', () => {
      const allergy = { ...sampleWithRequiredData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.update(allergy).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PUT' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should partial update a Allergy', () => {
      const patchObject = { ...sampleWithPartialData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.partialUpdate(patchObject).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PATCH' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should return a list of Allergy', () => {
      const returnedFromService = { ...requireRestSample };

      const expected = { ...sampleWithRequiredData };

      service.query().subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush([returnedFromService]);
      httpMock.verify();
      expect(expectedResult).toMatchObject([expected]);
    });

    it('should delete a Allergy', () => {
      const expected = true;

      service.delete('ABC').subscribe(resp => (expectedResult = resp.ok));

      const req = httpMock.expectOne({ method: 'DELETE' });
      req.flush({ status: 200 });
      expect(expectedResult).toBe(expected);
    });

    describe('addAllergyToCollectionIfMissing', () => {
      it('should add a Allergy to an empty array', () => {
        const allergy: IAllergy = sampleWithRequiredData;
        expectedResult = service.addAllergyToCollectionIfMissing([], allergy);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(allergy);
      });

      it('should not add a Allergy to an array that contains it', () => {
        const allergy: IAllergy = sampleWithRequiredData;
        const allergyCollection: IAllergy[] = [
          {
            ...allergy,
          },
          sampleWithPartialData,
        ];
        expectedResult = service.addAllergyToCollectionIfMissing(allergyCollection, allergy);
        expect(expectedResult).toHaveLength(2);
      });

      it("should add a Allergy to an array that doesn't contain it", () => {
        const allergy: IAllergy = sampleWithRequiredData;
        const allergyCollection: IAllergy[] = [sampleWithPartialData];
        expectedResult = service.addAllergyToCollectionIfMissing(allergyCollection, allergy);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(allergy);
      });

      it('should add only unique Allergy to an array', () => {
        const allergyArray: IAllergy[] = [sampleWithRequiredData, sampleWithPartialData, sampleWithFullData];
        const allergyCollection: IAllergy[] = [sampleWithRequiredData];
        expectedResult = service.addAllergyToCollectionIfMissing(allergyCollection, ...allergyArray);
        expect(expectedResult).toHaveLength(3);
      });

      it('should accept varargs', () => {
        const allergy: IAllergy = sampleWithRequiredData;
        const allergy2: IAllergy = sampleWithPartialData;
        expectedResult = service.addAllergyToCollectionIfMissing([], allergy, allergy2);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(allergy);
        expect(expectedResult).toContain(allergy2);
      });

      it('should accept null and undefined values', () => {
        const allergy: IAllergy = sampleWithRequiredData;
        expectedResult = service.addAllergyToCollectionIfMissing([], null, allergy, undefined);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(allergy);
      });

      it('should return initial array if no Allergy is added', () => {
        const allergyCollection: IAllergy[] = [sampleWithRequiredData];
        expectedResult = service.addAllergyToCollectionIfMissing(allergyCollection, undefined, null);
        expect(expectedResult).toEqual(allergyCollection);
      });
    });

    describe('compareAllergy', () => {
      it('Should return true if both entities are null', () => {
        const entity1 = null;
        const entity2 = null;

        const compareResult = service.compareAllergy(entity1, entity2);

        expect(compareResult).toEqual(true);
      });

      it('Should return false if one entity is null', () => {
        const entity1 = { id: 'ABC' };
        const entity2 = null;

        const compareResult1 = service.compareAllergy(entity1, entity2);
        const compareResult2 = service.compareAllergy(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey differs', () => {
        const entity1 = { id: 'ABC' };
        const entity2 = { id: 'CBA' };

        const compareResult1 = service.compareAllergy(entity1, entity2);
        const compareResult2 = service.compareAllergy(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey matches', () => {
        const entity1 = { id: 'ABC' };
        const entity2 = { id: 'ABC' };

        const compareResult1 = service.compareAllergy(entity1, entity2);
        const compareResult2 = service.compareAllergy(entity2, entity1);

        expect(compareResult1).toEqual(true);
        expect(compareResult2).toEqual(true);
      });
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
