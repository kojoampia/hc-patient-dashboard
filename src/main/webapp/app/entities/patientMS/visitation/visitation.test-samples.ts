import dayjs from 'dayjs/esm';

import { IVisitation, NewVisitation } from './visitation.model';

export const sampleWithRequiredData: IVisitation = {
  id: '00a769a9-a9b7-4fe2-92ba-4b6a1ee387a8',
};

export const sampleWithPartialData: IVisitation = {
  id: 'b53537c9-4b0d-4112-9802-9d05135ab1a4',
  visitedAt: dayjs('2026-08-02T16:14'),
  purpose: 'mechanically surprised equally',
  notes: 'worth that',
  createdDate: dayjs('2026-08-02'),
  modifiedDate: dayjs('2026-08-03'),
};

export const sampleWithFullData: IVisitation = {
  id: 'c95b143d-c620-48f9-bb59-15018f3551cd',
  patientId: 'duh jittery briefly',
  caseId: 'sheathe',
  professionalId: 'nonbeliever bet',
  visitedAt: dayjs('2026-08-02T09:54'),
  purpose: 'detective',
  location: 'including',
  notes: 'frosty which',
  createdDate: dayjs('2026-08-03'),
  modifiedDate: dayjs('2026-08-02'),
  createdBy: 'vastly huzzah',
  modifiedBy: 'yet off',
};

export const sampleWithNewData: NewVisitation = {
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
