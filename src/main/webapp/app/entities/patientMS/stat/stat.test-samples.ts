import dayjs from 'dayjs/esm';

import { IStat, NewStat } from './stat.model';

export const sampleWithRequiredData: IStat = {
  id: '13026c7a-1147-4ad2-a3d5-b08904bc6d9b',
};

export const sampleWithPartialData: IStat = {
  id: 'b120cdbc-3465-4b0f-8f15-9e317e106544',
  patientId: 'stamina which',
  type: 'skateboard',
  name: 'fend silent finally',
  secondaryValue: 27971.73,
  unit: 'shy',
  flag: 'DANGER',
  recordedAt: dayjs('2024-02-06T20:37'),
};

export const sampleWithFullData: IStat = {
  id: 'aad13c4f-2b03-49eb-8063-5e53b86f3385',
  patientId: 'hike lychee yuck',
  type: 'amongst exposure secretion',
  name: 'quicker gosh stormy',
  description: 'clamp ew underneath',
  value: 32124.78,
  secondaryValue: 31536.91,
  unit: 'now marxism weakness',
  referenceLow: 6517.12,
  referenceHigh: 23757.16,
  flag: 'DANGER',
  note: 'spread gadzooks yahoo',
  recordedAt: dayjs('2024-02-06T19:45'),
  createdDate: dayjs('2024-02-05'),
  createdBy: 'meh unselfish',
};

export const sampleWithNewData: NewStat = {
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
