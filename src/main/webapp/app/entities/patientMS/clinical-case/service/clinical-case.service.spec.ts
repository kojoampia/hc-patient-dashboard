import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { IClinicalCase } from '../clinical-case.model';
import { sampleWithRequiredData, sampleWithNewData, sampleWithPartialData, sampleWithFullData } from '../clinical-case.test-samples';

import { ClinicalCaseService, RestClinicalCase } from './clinical-case.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

const requireRestSample: RestClinicalCase = {
  ...sampleWithRequiredData,
  openedAt: sampleWithRequiredData.openedAt?.toJSON(),
  closedAt: sampleWithRequiredData.closedAt?.toJSON(),
  archivedAt: sampleWithRequiredData.archivedAt?.toJSON(),
};

describe('ClinicalCase Service', () => {
  let service: ClinicalCaseService;
  let httpMock: HttpTestingController;
  let expectedResult: IClinicalCase | IClinicalCase[] | boolean | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()],
    });
    expectedResult = null;
    service = TestBed.inject(ClinicalCaseService);
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

    it('should create a ClinicalCase', () => {
      const clinicalCase = { ...sampleWithNewData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.create(clinicalCase).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'POST' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should update a ClinicalCase', () => {
      const clinicalCase = { ...sampleWithRequiredData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.update(clinicalCase).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PUT' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should partial update a ClinicalCase', () => {
      const patchObject = { ...sampleWithPartialData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.partialUpdate(patchObject).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PATCH' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should return a list of ClinicalCase', () => {
      const returnedFromService = { ...requireRestSample };

      const expected = { ...sampleWithRequiredData };

      service.query().subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush([returnedFromService]);
      httpMock.verify();
      expect(expectedResult).toMatchObject([expected]);
    });

    it('should delete a ClinicalCase', () => {
      const expected = true;

      service.delete('ABC').subscribe(resp => (expectedResult = resp.ok));

      const req = httpMock.expectOne({ method: 'DELETE' });
      req.flush({ status: 200 });
      expect(expectedResult).toBe(expected);
    });

    describe('addClinicalCaseToCollectionIfMissing', () => {
      it('should add a ClinicalCase to an empty array', () => {
        const clinicalCase: IClinicalCase = sampleWithRequiredData;
        expectedResult = service.addClinicalCaseToCollectionIfMissing([], clinicalCase);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(clinicalCase);
      });

      it('should not add a ClinicalCase to an array that contains it', () => {
        const clinicalCase: IClinicalCase = sampleWithRequiredData;
        const clinicalCaseCollection: IClinicalCase[] = [
          {
            ...clinicalCase,
          },
          sampleWithPartialData,
        ];
        expectedResult = service.addClinicalCaseToCollectionIfMissing(clinicalCaseCollection, clinicalCase);
        expect(expectedResult).toHaveLength(2);
      });

      it("should add a ClinicalCase to an array that doesn't contain it", () => {
        const clinicalCase: IClinicalCase = sampleWithRequiredData;
        const clinicalCaseCollection: IClinicalCase[] = [sampleWithPartialData];
        expectedResult = service.addClinicalCaseToCollectionIfMissing(clinicalCaseCollection, clinicalCase);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(clinicalCase);
      });

      it('should add only unique ClinicalCase to an array', () => {
        const clinicalCaseArray: IClinicalCase[] = [sampleWithRequiredData, sampleWithPartialData, sampleWithFullData];
        const clinicalCaseCollection: IClinicalCase[] = [sampleWithRequiredData];
        expectedResult = service.addClinicalCaseToCollectionIfMissing(clinicalCaseCollection, ...clinicalCaseArray);
        expect(expectedResult).toHaveLength(3);
      });

      it('should accept varargs', () => {
        const clinicalCase: IClinicalCase = sampleWithRequiredData;
        const clinicalCase2: IClinicalCase = sampleWithPartialData;
        expectedResult = service.addClinicalCaseToCollectionIfMissing([], clinicalCase, clinicalCase2);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(clinicalCase);
        expect(expectedResult).toContain(clinicalCase2);
      });

      it('should accept null and undefined values', () => {
        const clinicalCase: IClinicalCase = sampleWithRequiredData;
        expectedResult = service.addClinicalCaseToCollectionIfMissing([], null, clinicalCase, undefined);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(clinicalCase);
      });

      it('should return initial array if no ClinicalCase is added', () => {
        const clinicalCaseCollection: IClinicalCase[] = [sampleWithRequiredData];
        expectedResult = service.addClinicalCaseToCollectionIfMissing(clinicalCaseCollection, undefined, null);
        expect(expectedResult).toEqual(clinicalCaseCollection);
      });
    });

    describe('compareClinicalCase', () => {
      it('Should return true if both entities are null', () => {
        const entity1 = null;
        const entity2 = null;

        const compareResult = service.compareClinicalCase(entity1, entity2);

        expect(compareResult).toEqual(true);
      });

      it('Should return false if one entity is null', () => {
        const entity1 = { id: 'ABC' };
        const entity2 = null;

        const compareResult1 = service.compareClinicalCase(entity1, entity2);
        const compareResult2 = service.compareClinicalCase(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey differs', () => {
        const entity1 = { id: 'ABC' };
        const entity2 = { id: 'CBA' };

        const compareResult1 = service.compareClinicalCase(entity1, entity2);
        const compareResult2 = service.compareClinicalCase(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey matches', () => {
        const entity1 = { id: 'ABC' };
        const entity2 = { id: 'ABC' };

        const compareResult1 = service.compareClinicalCase(entity1, entity2);
        const compareResult2 = service.compareClinicalCase(entity2, entity1);

        expect(compareResult1).toEqual(true);
        expect(compareResult2).toEqual(true);
      });
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
