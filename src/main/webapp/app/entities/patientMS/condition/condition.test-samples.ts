import dayjs from 'dayjs/esm';

import { ICondition, NewCondition } from './condition.model';

export const sampleWithRequiredData: ICondition = {
  id: '7de9afc9-1807-4599-98c6-07703f982a2a',
};

export const sampleWithPartialData: ICondition = {
  id: '4ea1a174-d910-4a4b-b1e4-5e2a597b2736',
  description: 'fiercely hair',
  modifiedDate: dayjs('2024-02-06'),
};

export const sampleWithFullData: ICondition = {
  id: 'cd816de4-d5c4-424c-8fca-25c7db53bd85',
  name: 'utilise rap',
  description: 'blah organization handmaiden',
  patientId: 'including',
  createdDate: dayjs('2024-02-06'),
  modifiedDate: dayjs('2024-02-06'),
  createdBy: 'hostess yahoo per',
  modifiedBy: 'which lour commercial',
};

export const sampleWithNewData: NewCondition = {
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
