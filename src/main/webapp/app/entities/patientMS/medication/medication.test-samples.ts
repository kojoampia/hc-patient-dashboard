import dayjs from 'dayjs/esm';

import { IMedication, NewMedication } from './medication.model';

export const sampleWithRequiredData: IMedication = {
  id: '3eb11dfc-9e38-441c-84dc-9211dc138269',
};

export const sampleWithPartialData: IMedication = {
  id: '8eae746d-62fa-4c13-ac1b-581e8427d909',
  name: 'neutralise overconfidently adobe',
  caseId: 'because below',
  dosage: 'save',
  status: 'ACTIVE',
  startedOn: dayjs('2024-02-06'),
  prescribedById: 'now',
  createdDate: dayjs('2024-02-06'),
  modifiedDate: dayjs('2024-02-06'),
  modifiedBy: 'scarce',
};

export const sampleWithFullData: IMedication = {
  id: '52f4015a-0feb-43da-a89b-0116724ec51d',
  name: 'yippee sheepishly',
  description: 'cheerful',
  patientId: 'evince abstract proud',
  caseId: 'rapidly',
  prescription: 'silhouette above',
  dosage: 'incidentally draft amid',
  status: 'COMPLETED',
  startedOn: dayjs('2024-02-06'),
  prescribedById: 'mostly gosh',
  createdDate: dayjs('2024-02-06'),
  modifiedDate: dayjs('2024-02-06'),
  createdBy: 'gosh concentration',
  modifiedBy: 'drat paltry',
};

export const sampleWithNewData: NewMedication = {
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
