import dayjs from 'dayjs/esm';

import { ITask, NewTask } from './task.model';

export const sampleWithRequiredData: ITask = {
  id: 'ca5a8135-f7fa-4a24-a9ea-9206f0a0a542',
};

export const sampleWithPartialData: ITask = {
  id: '8fba50ce-04f2-4d2d-ac0b-cd57c2cd07ad',
  description: 'along',
  scheduledAt: dayjs('2024-02-06T04:31'),
  status: 'PENDING',
  caseId: 'nor drat dinner',
};

export const sampleWithFullData: ITask = {
  id: 'cc6f7e32-fa49-4ec7-9da6-1234928a491d',
  name: 'median where huzzah',
  description: 'abaft encroach',
  schedule: dayjs('2024-02-06'),
  scheduledAt: dayjs('2024-02-06T05:17'),
  duration: 7605.6,
  status: 'PENDING',
  location: 'gah innocent',
  caseId: 'um cap closely',
  attendantId: 'that',
  teamId: 'bah uh-huh cheque',
  patientId: 'questioningly as alongside',
  attendant: 'yet beside woot',
  createdDate: dayjs('2024-02-06'),
  modifiedDate: dayjs('2024-02-06'),
  createdBy: 'conga',
  modifiedBy: 'exude',
};

export const sampleWithNewData: NewTask = {
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
