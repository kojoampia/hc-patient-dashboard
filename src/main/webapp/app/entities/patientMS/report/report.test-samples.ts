import dayjs from 'dayjs/esm';

import { IReport, NewReport } from './report.model';

export const sampleWithRequiredData: IReport = {
  id: 'c21d45eb-8dd7-4ef8-a1c6-c8525a9a98d8',
};

export const sampleWithPartialData: IReport = {
  id: 'aa77c20e-50cc-4daf-a753-7385448af023',
  category: 'underneath after hearten',
  description: 'provided because honored',
  summary: 'regal gosh',
  name: 'commit',
  patientId: 'roughly and',
  reportDate: dayjs('2024-02-06'),
  createdDate: dayjs('2024-02-06'),
  modifiedBy: 'upset an',
};

export const sampleWithFullData: IReport = {
  id: '5addf29d-6590-4095-8ff8-73675b0fac57',
  category: 'blindly',
  description: 'since yahoo peel',
  summary: 'indeed fortunately',
  name: 'er',
  url: 'https://prickly-detour.name/',
  patientId: 'circa',
  caseId: 'till fiber',
  authorId: 'tromp when',
  reportDate: dayjs('2024-02-06'),
  createdDate: dayjs('2024-02-06'),
  modifiedDate: dayjs('2024-02-06'),
  createdBy: 'melon',
  modifiedBy: 'ew pish',
};

export const sampleWithNewData: NewReport = {
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
