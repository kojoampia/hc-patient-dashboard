import dayjs from 'dayjs/esm';

import { IAllergy, NewAllergy } from './allergy.model';

export const sampleWithRequiredData: IAllergy = {
  id: 'f890eaf1-a006-40e4-8817-1d014942de18',
};

export const sampleWithPartialData: IAllergy = {
  id: '6aa33876-2cd0-448c-9e0b-de077285d87d',
  name: 'stealthily always',
  category: 'ENVIRONMENTAL',
  severity: 'MILD',
  reaction: 'common',
  notedOn: dayjs('2026-08-02'),
};

export const sampleWithFullData: IAllergy = {
  id: '3f124e67-7c61-4f33-80f3-32596dffc900',
  patientId: 'ick',
  name: 'usefully punch versus',
  category: 'OTHER',
  severity: 'MILD',
  reaction: 'crooked duh',
  notedOn: dayjs('2026-08-02'),
  notedById: 'adored',
  createdDate: dayjs('2026-08-03'),
  modifiedDate: dayjs('2026-08-02'),
  createdBy: 'probable',
  modifiedBy: 'prance uh-huh so',
};

export const sampleWithNewData: NewAllergy = {
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
