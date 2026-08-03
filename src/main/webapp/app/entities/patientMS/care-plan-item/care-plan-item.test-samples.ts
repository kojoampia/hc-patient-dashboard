import dayjs from 'dayjs/esm';

import { ICarePlanItem, NewCarePlanItem } from './care-plan-item.model';

export const sampleWithRequiredData: ICarePlanItem = {
  id: '6d790180-25bc-4757-bc6d-87a0b7c10f6b',
};

export const sampleWithPartialData: ICarePlanItem = {
  id: 'ed471dda-df45-4b63-9358-d49850bda869',
  detail: 'guideline',
  cadence: 'yum',
  createdDate: dayjs('2026-08-03'),
  modifiedBy: 'important snooker',
};

export const sampleWithFullData: ICarePlanItem = {
  id: 'a996b3cc-85a0-462a-b0bb-a5dac05d83a3',
  patientId: 'dirndl aggravating oh',
  planType: 'DIET',
  label: 'calmly finally schtup',
  detail: 'except that thoroughly',
  cadence: 'victoriously',
  completed: false,
  sortOrder: 5681,
  createdDate: dayjs('2026-08-02'),
  modifiedDate: dayjs('2026-08-03'),
  createdBy: 'bar between',
  modifiedBy: 'besides pish',
};

export const sampleWithNewData: NewCarePlanItem = {
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
