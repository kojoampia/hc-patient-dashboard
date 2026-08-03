import dayjs from 'dayjs/esm';

import { IClinicalCase, NewClinicalCase } from './clinical-case.model';

export const sampleWithRequiredData: IClinicalCase = {
  id: 'b54eb750-5cf5-4b1d-bb1d-08ffd36f5e7c',
};

export const sampleWithPartialData: IClinicalCase = {
  id: '136f1263-9d5d-4edb-b907-e78ee3c7af66',
  title: 'closely awkwardly',
  brief: 'impartial',
  symptoms: 'tomorrow gosh than',
  assignedProfessionalId: 'like',
  assignedRosterId: 'scrimp microlending',
};

export const sampleWithFullData: IClinicalCase = {
  id: 'cf5c3139-62c0-427d-8ca9-156e61602df2',
  patientId: 'opposite',
  caseNumber: 24102,
  title: 'hmph when deceivingly',
  openedAt: dayjs('2026-07-30T02:27'),
  closedAt: dayjs('2026-07-29T16:11'),
  brief: 'excluding dearly mmm',
  status: 'CLOSED',
  symptoms: 'hideous out nail',
  diagnosis: 'meh',
  assignedProfessionalId: 'single darn who',
  assignedRosterId: 'hopelessly',
};

export const sampleWithNewData: NewClinicalCase = {
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
