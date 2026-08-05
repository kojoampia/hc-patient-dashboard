import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { IPaymentOption } from '../payment-option.model';
import { sampleWithRequiredData, sampleWithNewData, sampleWithPartialData, sampleWithFullData } from '../payment-option.test-samples';

import { PaymentOptionService } from './payment-option.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

const requireRestSample: IPaymentOption = {
  ...sampleWithRequiredData,
};

describe('PaymentOption Service', () => {
  let service: PaymentOptionService;
  let httpMock: HttpTestingController;
  let expectedResult: IPaymentOption | IPaymentOption[] | boolean | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
});
    expectedResult = null;
    service = TestBed.inject(PaymentOptionService);
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

    it('should create a PaymentOption', () => {
      const paymentOption = { ...sampleWithNewData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.create(paymentOption).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'POST' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should update a PaymentOption', () => {
      const paymentOption = { ...sampleWithRequiredData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.update(paymentOption).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PUT' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should partial update a PaymentOption', () => {
      const patchObject = { ...sampleWithPartialData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.partialUpdate(patchObject).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PATCH' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should return a list of PaymentOption', () => {
      const returnedFromService = { ...requireRestSample };

      const expected = { ...sampleWithRequiredData };

      service.query().subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush([returnedFromService]);
      httpMock.verify();
      expect(expectedResult).toMatchObject([expected]);
    });

    it('should delete a PaymentOption', () => {
      const expected = true;

      service.delete('ABC').subscribe(resp => (expectedResult = resp.ok));

      const req = httpMock.expectOne({ method: 'DELETE' });
      req.flush({ status: 200 });
      expect(expectedResult).toBe(expected);
    });

    describe('addPaymentOptionToCollectionIfMissing', () => {
      it('should add a PaymentOption to an empty array', () => {
        const paymentOption: IPaymentOption = sampleWithRequiredData;
        expectedResult = service.addPaymentOptionToCollectionIfMissing([], paymentOption);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(paymentOption);
      });

      it('should not add a PaymentOption to an array that contains it', () => {
        const paymentOption: IPaymentOption = sampleWithRequiredData;
        const paymentOptionCollection: IPaymentOption[] = [
          {
            ...paymentOption,
          },
          sampleWithPartialData,
        ];
        expectedResult = service.addPaymentOptionToCollectionIfMissing(paymentOptionCollection, paymentOption);
        expect(expectedResult).toHaveLength(2);
      });

      it("should add a PaymentOption to an array that doesn't contain it", () => {
        const paymentOption: IPaymentOption = sampleWithRequiredData;
        const paymentOptionCollection: IPaymentOption[] = [sampleWithPartialData];
        expectedResult = service.addPaymentOptionToCollectionIfMissing(paymentOptionCollection, paymentOption);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(paymentOption);
      });

      it('should add only unique PaymentOption to an array', () => {
        const paymentOptionArray: IPaymentOption[] = [sampleWithRequiredData, sampleWithPartialData, sampleWithFullData];
        const paymentOptionCollection: IPaymentOption[] = [sampleWithRequiredData];
        expectedResult = service.addPaymentOptionToCollectionIfMissing(paymentOptionCollection, ...paymentOptionArray);
        expect(expectedResult).toHaveLength(3);
      });

      it('should accept varargs', () => {
        const paymentOption: IPaymentOption = sampleWithRequiredData;
        const paymentOption2: IPaymentOption = sampleWithPartialData;
        expectedResult = service.addPaymentOptionToCollectionIfMissing([], paymentOption, paymentOption2);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(paymentOption);
        expect(expectedResult).toContain(paymentOption2);
      });

      it('should accept null and undefined values', () => {
        const paymentOption: IPaymentOption = sampleWithRequiredData;
        expectedResult = service.addPaymentOptionToCollectionIfMissing([], null, paymentOption, undefined);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(paymentOption);
      });

      it('should return initial array if no PaymentOption is added', () => {
        const paymentOptionCollection: IPaymentOption[] = [sampleWithRequiredData];
        expectedResult = service.addPaymentOptionToCollectionIfMissing(paymentOptionCollection, undefined, null);
        expect(expectedResult).toEqual(paymentOptionCollection);
      });
    });

    describe('comparePaymentOption', () => {
      it('Should return true if both entities are null', () => {
        const entity1 = null;
        const entity2 = null;

        const compareResult = service.comparePaymentOption(entity1, entity2);

        expect(compareResult).toEqual(true);
      });

      it('Should return false if one entity is null', () => {
        const entity1 = { id: 'ABC' };
        const entity2 = null;

        const compareResult1 = service.comparePaymentOption(entity1, entity2);
        const compareResult2 = service.comparePaymentOption(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey differs', () => {
        const entity1 = { id: 'ABC' };
        const entity2 = { id: 'CBA' };

        const compareResult1 = service.comparePaymentOption(entity1, entity2);
        const compareResult2 = service.comparePaymentOption(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey matches', () => {
        const entity1 = { id: 'ABC' };
        const entity2 = { id: 'ABC' };

        const compareResult1 = service.comparePaymentOption(entity1, entity2);
        const compareResult2 = service.comparePaymentOption(entity2, entity1);

        expect(compareResult1).toEqual(true);
        expect(compareResult2).toEqual(true);
      });
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
