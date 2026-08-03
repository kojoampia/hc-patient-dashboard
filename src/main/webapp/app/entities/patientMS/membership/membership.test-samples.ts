import dayjs from 'dayjs/esm';

import { IMembership, NewMembership } from './membership.model';

export const sampleWithRequiredData: IMembership = {
  id: '661cc578-5629-4b9f-951c-eea52a1c3488',
};

export const sampleWithPartialData: IMembership = {
  id: '6d2cd9c8-0771-4773-9ee2-ad735eedab42',
  patientId: 'versus successfully',
  name: 'fly geez',
  description: 'science excepting coo',
  status: 'suit starchy',
  plan: 'reinscription whether eradicate',
  renewalDate: dayjs('2024-02-06'),
  createdBy: 'blissfully thrifty',
};

export const sampleWithFullData: IMembership = {
  id: '9d7284bc-27ea-4dc7-9bbd-5eab9a70e675',
  patientId: 'bleakly saturate',
  name: 'fourths haunting sharply',
  description: 'thigh gee',
  status: 'mislay heater',
  memberNumber: 'yuck vapid',
  plan: 'across',
  startDate: dayjs('2024-02-06'),
  renewalDate: dayjs('2024-02-06'),
  createdDate: dayjs('2024-02-06'),
  modifiedDate: dayjs('2024-02-06'),
  createdBy: 'barring brr flimsy',
  modifiedBy: 'lest oil',
};

export const sampleWithNewData: NewMembership = {
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
