import dayjs from 'dayjs/esm';

import { IEmergency, NewEmergency } from './emergency.model';

export const sampleWithRequiredData: IEmergency = {
  id: 'cc751722-c813-4fd5-b21f-5b20665e2694',
};

export const sampleWithPartialData: IEmergency = {
  id: 'a3517bd5-b47b-403c-8d20-d491b259f496',
  patientId: 'gosh',
  resolvedAt: dayjs('2026-08-02T14:21'),
  detail: 'direct er shine',
  severity: 'MODERATE',
  outcome: 'during awkwardly',
  createdDate: dayjs('2026-08-02'),
  createdBy: 'reapply till',
  modifiedBy: 'tomorrow',
};

export const sampleWithFullData: IEmergency = {
  id: '520d75f8-4719-482e-b8a8-9cb7fd758dbd',
  patientId: 'undermine outside',
  caseId: 'swipe courageous',
  raisedAt: dayjs('2026-08-03T01:57'),
  resolvedAt: dayjs('2026-08-02T13:52'),
  brief: 'quarrelsomely ha',
  detail: 'seeder shakily slew',
  severity: 'HIGH',
  status: 'RAISED',
  outcome: 'yet',
  location: 'gosh digitize but',
  respondentId: 'unless yippee',
  createdDate: dayjs('2026-08-02'),
  modifiedDate: dayjs('2026-08-03'),
  createdBy: 'boo',
  modifiedBy: 'ironclad greedy',
};

export const sampleWithNewData: NewEmergency = {
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
