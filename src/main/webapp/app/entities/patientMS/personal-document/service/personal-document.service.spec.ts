import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { DATE_FORMAT } from 'app/config/input.constants';
import { IPersonalDocument } from '../personal-document.model';
import { sampleWithRequiredData, sampleWithNewData, sampleWithPartialData, sampleWithFullData } from '../personal-document.test-samples';

import { PersonalDocumentService, RestPersonalDocument } from './personal-document.service';

const requireRestSample: RestPersonalDocument = {
  ...sampleWithRequiredData,
  issuedOn: sampleWithRequiredData.issuedOn?.format(DATE_FORMAT),
  expiresOn: sampleWithRequiredData.expiresOn?.format(DATE_FORMAT),
};

describe('PersonalDocument Service', () => {
  let service: PersonalDocumentService;
  let httpMock: HttpTestingController;
  let expectedResult: IPersonalDocument | IPersonalDocument[] | boolean | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    expectedResult = null;
    service = TestBed.inject(PersonalDocumentService);
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

    it('should create a PersonalDocument', () => {
      const personalDocument = { ...sampleWithNewData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.create(personalDocument).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'POST' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should update a PersonalDocument', () => {
      const personalDocument = { ...sampleWithRequiredData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.update(personalDocument).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PUT' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should partial update a PersonalDocument', () => {
      const patchObject = { ...sampleWithPartialData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.partialUpdate(patchObject).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PATCH' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should return a list of PersonalDocument', () => {
      const returnedFromService = { ...requireRestSample };

      const expected = { ...sampleWithRequiredData };

      service.query().subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush([returnedFromService]);
      httpMock.verify();
      expect(expectedResult).toMatchObject([expected]);
    });

    it('should delete a PersonalDocument', () => {
      const expected = true;

      service.delete('ABC').subscribe(resp => (expectedResult = resp.ok));

      const req = httpMock.expectOne({ method: 'DELETE' });
      req.flush({ status: 200 });
      expect(expectedResult).toBe(expected);
    });

    describe('addPersonalDocumentToCollectionIfMissing', () => {
      it('should add a PersonalDocument to an empty array', () => {
        const personalDocument: IPersonalDocument = sampleWithRequiredData;
        expectedResult = service.addPersonalDocumentToCollectionIfMissing([], personalDocument);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(personalDocument);
      });

      it('should not add a PersonalDocument to an array that contains it', () => {
        const personalDocument: IPersonalDocument = sampleWithRequiredData;
        const personalDocumentCollection: IPersonalDocument[] = [
          {
            ...personalDocument,
          },
          sampleWithPartialData,
        ];
        expectedResult = service.addPersonalDocumentToCollectionIfMissing(personalDocumentCollection, personalDocument);
        expect(expectedResult).toHaveLength(2);
      });

      it("should add a PersonalDocument to an array that doesn't contain it", () => {
        const personalDocument: IPersonalDocument = sampleWithRequiredData;
        const personalDocumentCollection: IPersonalDocument[] = [sampleWithPartialData];
        expectedResult = service.addPersonalDocumentToCollectionIfMissing(personalDocumentCollection, personalDocument);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(personalDocument);
      });

      it('should add only unique PersonalDocument to an array', () => {
        const personalDocumentArray: IPersonalDocument[] = [sampleWithRequiredData, sampleWithPartialData, sampleWithFullData];
        const personalDocumentCollection: IPersonalDocument[] = [sampleWithRequiredData];
        expectedResult = service.addPersonalDocumentToCollectionIfMissing(personalDocumentCollection, ...personalDocumentArray);
        expect(expectedResult).toHaveLength(3);
      });

      it('should accept varargs', () => {
        const personalDocument: IPersonalDocument = sampleWithRequiredData;
        const personalDocument2: IPersonalDocument = sampleWithPartialData;
        expectedResult = service.addPersonalDocumentToCollectionIfMissing([], personalDocument, personalDocument2);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(personalDocument);
        expect(expectedResult).toContain(personalDocument2);
      });

      it('should accept null and undefined values', () => {
        const personalDocument: IPersonalDocument = sampleWithRequiredData;
        expectedResult = service.addPersonalDocumentToCollectionIfMissing([], null, personalDocument, undefined);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(personalDocument);
      });

      it('should return initial array if no PersonalDocument is added', () => {
        const personalDocumentCollection: IPersonalDocument[] = [sampleWithRequiredData];
        expectedResult = service.addPersonalDocumentToCollectionIfMissing(personalDocumentCollection, undefined, null);
        expect(expectedResult).toEqual(personalDocumentCollection);
      });
    });

    describe('comparePersonalDocument', () => {
      it('Should return true if both entities are null', () => {
        const entity1 = null;
        const entity2 = null;

        const compareResult = service.comparePersonalDocument(entity1, entity2);

        expect(compareResult).toEqual(true);
      });

      it('Should return false if one entity is null', () => {
        const entity1 = { id: 'ABC' };
        const entity2 = null;

        const compareResult1 = service.comparePersonalDocument(entity1, entity2);
        const compareResult2 = service.comparePersonalDocument(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey differs', () => {
        const entity1 = { id: 'ABC' };
        const entity2 = { id: 'CBA' };

        const compareResult1 = service.comparePersonalDocument(entity1, entity2);
        const compareResult2 = service.comparePersonalDocument(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey matches', () => {
        const entity1 = { id: 'ABC' };
        const entity2 = { id: 'ABC' };

        const compareResult1 = service.comparePersonalDocument(entity1, entity2);
        const compareResult2 = service.comparePersonalDocument(entity2, entity1);

        expect(compareResult1).toEqual(true);
        expect(compareResult2).toEqual(true);
      });
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
