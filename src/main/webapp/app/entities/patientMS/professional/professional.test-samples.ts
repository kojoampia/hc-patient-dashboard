import dayjs from 'dayjs/esm';

import { IProfessional, NewProfessional } from './professional.model';

export const sampleWithRequiredData: IProfessional = {
  id: '83bb4ac8-4932-412f-bff8-c8cfec451a0b',
};

export const sampleWithPartialData: IProfessional = {
  id: '90d1ed98-bc59-4ac5-ac40-8771b5fbf5f8',
  lastName: 'Runolfsson',
  phoneNumber: 'seldom',
  initials: 'anti astonishing',
  location: 'fashion',
  teamId: 'uh-huh unless out',
  createdDate: dayjs('2026-08-03'),
  createdBy: 'prickly duh inasmuch',
  modifiedBy: 'vastly opposite parade',
};

export const sampleWithFullData: IProfessional = {
  id: '3054f5b6-b963-4b86-be4c-153425431186',
  firstName: 'Aleen',
  lastName: 'Gulgowski',
  role: 'representation shallow',
  specialty: 'smoothly',
  email: 'Faustino_Buckridge25@hotmail.com',
  phoneNumber: 'huzzah',
  imageUrl: 'yieldingly best',
  initials: 'mysteriously late',
  location: 'meh until because',
  teamId: 'since failing self-assured',
  createdDate: dayjs('2026-08-02'),
  modifiedDate: dayjs('2026-08-03'),
  createdBy: 'almost chase round',
  modifiedBy: 'wherever boastfully',
};

export const sampleWithNewData: NewProfessional = {
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
