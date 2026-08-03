import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { DATE_FORMAT } from 'app/config/input.constants';
import { IActivityLog } from '../activity-log.model';
import { sampleWithRequiredData, sampleWithNewData, sampleWithPartialData, sampleWithFullData } from '../activity-log.test-samples';

import { ActivityLogService, RestActivityLog } from './activity-log.service';

const requireRestSample: RestActivityLog = {
  ...sampleWithRequiredData,
  loggedAt: sampleWithRequiredData.loggedAt?.toJSON(),
  createdDate: sampleWithRequiredData.createdDate?.format(DATE_FORMAT),
};

describe('ActivityLog Service', () => {
  let service: ActivityLogService;
  let httpMock: HttpTestingController;
  let expectedResult: IActivityLog | IActivityLog[] | boolean | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    expectedResult = null;
    service = TestBed.inject(ActivityLogService);
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

    it('should create a ActivityLog', () => {
      const activityLog = { ...sampleWithNewData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.create(activityLog).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'POST' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should update a ActivityLog', () => {
      const activityLog = { ...sampleWithRequiredData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.update(activityLog).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PUT' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should partial update a ActivityLog', () => {
      const patchObject = { ...sampleWithPartialData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.partialUpdate(patchObject).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PATCH' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should return a list of ActivityLog', () => {
      const returnedFromService = { ...requireRestSample };

      const expected = { ...sampleWithRequiredData };

      service.query().subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush([returnedFromService]);
      httpMock.verify();
      expect(expectedResult).toMatchObject([expected]);
    });

    it('should delete a ActivityLog', () => {
      const expected = true;

      service.delete('ABC').subscribe(resp => (expectedResult = resp.ok));

      const req = httpMock.expectOne({ method: 'DELETE' });
      req.flush({ status: 200 });
      expect(expectedResult).toBe(expected);
    });

    describe('addActivityLogToCollectionIfMissing', () => {
      it('should add a ActivityLog to an empty array', () => {
        const activityLog: IActivityLog = sampleWithRequiredData;
        expectedResult = service.addActivityLogToCollectionIfMissing([], activityLog);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(activityLog);
      });

      it('should not add a ActivityLog to an array that contains it', () => {
        const activityLog: IActivityLog = sampleWithRequiredData;
        const activityLogCollection: IActivityLog[] = [
          {
            ...activityLog,
          },
          sampleWithPartialData,
        ];
        expectedResult = service.addActivityLogToCollectionIfMissing(activityLogCollection, activityLog);
        expect(expectedResult).toHaveLength(2);
      });

      it("should add a ActivityLog to an array that doesn't contain it", () => {
        const activityLog: IActivityLog = sampleWithRequiredData;
        const activityLogCollection: IActivityLog[] = [sampleWithPartialData];
        expectedResult = service.addActivityLogToCollectionIfMissing(activityLogCollection, activityLog);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(activityLog);
      });

      it('should add only unique ActivityLog to an array', () => {
        const activityLogArray: IActivityLog[] = [sampleWithRequiredData, sampleWithPartialData, sampleWithFullData];
        const activityLogCollection: IActivityLog[] = [sampleWithRequiredData];
        expectedResult = service.addActivityLogToCollectionIfMissing(activityLogCollection, ...activityLogArray);
        expect(expectedResult).toHaveLength(3);
      });

      it('should accept varargs', () => {
        const activityLog: IActivityLog = sampleWithRequiredData;
        const activityLog2: IActivityLog = sampleWithPartialData;
        expectedResult = service.addActivityLogToCollectionIfMissing([], activityLog, activityLog2);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(activityLog);
        expect(expectedResult).toContain(activityLog2);
      });

      it('should accept null and undefined values', () => {
        const activityLog: IActivityLog = sampleWithRequiredData;
        expectedResult = service.addActivityLogToCollectionIfMissing([], null, activityLog, undefined);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(activityLog);
      });

      it('should return initial array if no ActivityLog is added', () => {
        const activityLogCollection: IActivityLog[] = [sampleWithRequiredData];
        expectedResult = service.addActivityLogToCollectionIfMissing(activityLogCollection, undefined, null);
        expect(expectedResult).toEqual(activityLogCollection);
      });
    });

    describe('compareActivityLog', () => {
      it('Should return true if both entities are null', () => {
        const entity1 = null;
        const entity2 = null;

        const compareResult = service.compareActivityLog(entity1, entity2);

        expect(compareResult).toEqual(true);
      });

      it('Should return false if one entity is null', () => {
        const entity1 = { id: 'ABC' };
        const entity2 = null;

        const compareResult1 = service.compareActivityLog(entity1, entity2);
        const compareResult2 = service.compareActivityLog(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey differs', () => {
        const entity1 = { id: 'ABC' };
        const entity2 = { id: 'CBA' };

        const compareResult1 = service.compareActivityLog(entity1, entity2);
        const compareResult2 = service.compareActivityLog(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey matches', () => {
        const entity1 = { id: 'ABC' };
        const entity2 = { id: 'ABC' };

        const compareResult1 = service.compareActivityLog(entity1, entity2);
        const compareResult2 = service.compareActivityLog(entity2, entity1);

        expect(compareResult1).toEqual(true);
        expect(compareResult2).toEqual(true);
      });
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
