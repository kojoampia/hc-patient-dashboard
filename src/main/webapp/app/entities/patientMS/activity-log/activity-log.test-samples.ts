import dayjs from 'dayjs/esm';

import { IActivityLog, NewActivityLog } from './activity-log.model';

export const sampleWithRequiredData: IActivityLog = {
  id: '119ee59e-f170-4599-8135-37e21441e7f4',
};

export const sampleWithPartialData: IActivityLog = {
  id: 'c0ac1153-0461-4a7e-8267-e4751bb80ac6',
  caseId: 'inn',
  detail: 'yowza',
  authorId: 'necessitate require from',
  createdDate: dayjs('2026-08-03'),
};

export const sampleWithFullData: IActivityLog = {
  id: '4d3294cb-6d06-4e75-a239-481e5ae783fd',
  patientId: 'gummy panda hut',
  caseId: 'perceive',
  loggedAt: dayjs('2026-08-03T02:37'),
  summary: 'livid conjure',
  detail: 'kiddingly besides boo',
  kind: 'RECOMMENDATION',
  source: 'PATIENT',
  authorId: 'attractive inasmuch apud',
  createdDate: dayjs('2026-08-02'),
  createdBy: 'majestically',
};

export const sampleWithNewData: NewActivityLog = {
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
