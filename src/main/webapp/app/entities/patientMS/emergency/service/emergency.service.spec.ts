import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { DATE_FORMAT } from 'app/config/input.constants';
import { IEmergency } from '../emergency.model';
import { sampleWithRequiredData, sampleWithNewData, sampleWithPartialData, sampleWithFullData } from '../emergency.test-samples';

import { EmergencyService, RestEmergency } from './emergency.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

const requireRestSample: RestEmergency = {
  ...sampleWithRequiredData,
  raisedAt: sampleWithRequiredData.raisedAt?.toJSON(),
  resolvedAt: sampleWithRequiredData.resolvedAt?.toJSON(),
  createdDate: sampleWithRequiredData.createdDate?.format(DATE_FORMAT),
  modifiedDate: sampleWithRequiredData.modifiedDate?.format(DATE_FORMAT),
};

describe('Emergency Service', () => {
  let service: EmergencyService;
  let httpMock: HttpTestingController;
  let expectedResult: IEmergency | IEmergency[] | boolean | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
});
    expectedResult = null;
    service = TestBed.inject(EmergencyService);
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

    it('should create a Emergency', () => {
      const emergency = { ...sampleWithNewData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.create(emergency).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'POST' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should update a Emergency', () => {
      const emergency = { ...sampleWithRequiredData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.update(emergency).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PUT' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should partial update a Emergency', () => {
      const patchObject = { ...sampleWithPartialData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.partialUpdate(patchObject).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PATCH' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should return a list of Emergency', () => {
      const returnedFromService = { ...requireRestSample };

      const expected = { ...sampleWithRequiredData };

      service.query().subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush([returnedFromService]);
      httpMock.verify();
      expect(expectedResult).toMatchObject([expected]);
    });

    it('should delete a Emergency', () => {
      const expected = true;

      service.delete('ABC').subscribe(resp => (expectedResult = resp.ok));

      const req = httpMock.expectOne({ method: 'DELETE' });
      req.flush({ status: 200 });
      expect(expectedResult).toBe(expected);
    });

    describe('addEmergencyToCollectionIfMissing', () => {
      it('should add a Emergency to an empty array', () => {
        const emergency: IEmergency = sampleWithRequiredData;
        expectedResult = service.addEmergencyToCollectionIfMissing([], emergency);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(emergency);
      });

      it('should not add a Emergency to an array that contains it', () => {
        const emergency: IEmergency = sampleWithRequiredData;
        const emergencyCollection: IEmergency[] = [
          {
            ...emergency,
          },
          sampleWithPartialData,
        ];
        expectedResult = service.addEmergencyToCollectionIfMissing(emergencyCollection, emergency);
        expect(expectedResult).toHaveLength(2);
      });

      it("should add a Emergency to an array that doesn't contain it", () => {
        const emergency: IEmergency = sampleWithRequiredData;
        const emergencyCollection: IEmergency[] = [sampleWithPartialData];
        expectedResult = service.addEmergencyToCollectionIfMissing(emergencyCollection, emergency);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(emergency);
      });

      it('should add only unique Emergency to an array', () => {
        const emergencyArray: IEmergency[] = [sampleWithRequiredData, sampleWithPartialData, sampleWithFullData];
        const emergencyCollection: IEmergency[] = [sampleWithRequiredData];
        expectedResult = service.addEmergencyToCollectionIfMissing(emergencyCollection, ...emergencyArray);
        expect(expectedResult).toHaveLength(3);
      });

      it('should accept varargs', () => {
        const emergency: IEmergency = sampleWithRequiredData;
        const emergency2: IEmergency = sampleWithPartialData;
        expectedResult = service.addEmergencyToCollectionIfMissing([], emergency, emergency2);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(emergency);
        expect(expectedResult).toContain(emergency2);
      });

      it('should accept null and undefined values', () => {
        const emergency: IEmergency = sampleWithRequiredData;
        expectedResult = service.addEmergencyToCollectionIfMissing([], null, emergency, undefined);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(emergency);
      });

      it('should return initial array if no Emergency is added', () => {
        const emergencyCollection: IEmergency[] = [sampleWithRequiredData];
        expectedResult = service.addEmergencyToCollectionIfMissing(emergencyCollection, undefined, null);
        expect(expectedResult).toEqual(emergencyCollection);
      });
    });

    describe('compareEmergency', () => {
      it('Should return true if both entities are null', () => {
        const entity1 = null;
        const entity2 = null;

        const compareResult = service.compareEmergency(entity1, entity2);

        expect(compareResult).toEqual(true);
      });

      it('Should return false if one entity is null', () => {
        const entity1 = { id: 'ABC' };
        const entity2 = null;

        const compareResult1 = service.compareEmergency(entity1, entity2);
        const compareResult2 = service.compareEmergency(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey differs', () => {
        const entity1 = { id: 'ABC' };
        const entity2 = { id: 'CBA' };

        const compareResult1 = service.compareEmergency(entity1, entity2);
        const compareResult2 = service.compareEmergency(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey matches', () => {
        const entity1 = { id: 'ABC' };
        const entity2 = { id: 'ABC' };

        const compareResult1 = service.compareEmergency(entity1, entity2);
        const compareResult2 = service.compareEmergency(entity2, entity1);

        expect(compareResult1).toEqual(true);
        expect(compareResult2).toEqual(true);
      });
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
