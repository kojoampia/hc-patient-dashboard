import dayjs from 'dayjs/esm';

import { IProfile, NewProfile } from './profile.model';

export const sampleWithRequiredData: IProfile = {
  id: '9d88b2f3-0b52-413c-8fcd-e9a2de486dea',
};

export const sampleWithPartialData: IProfile = {
  id: '68eccacf-d5d4-4c19-9c50-e3b42278295e',
  patientId: 'as besides humongous',
  membership: 'grin',
  birthDate: dayjs('2024-02-06'),
  sex: 'rural blank',
  phoneNumber: 'expert necessity',
  cardType: 'harsh',
  contacts: 'gall',
  // A document since care onboarding needed a structured address; the sample keeps the old free text as the
  // street so the fixtures still read like an address.
  address: { id: 'addr-sample-1', streetAddress: 'pesky affectionate molasses' },
  team: 'qua publicise',
  imageUrl: 'wording',
  about: 'total',
};

export const sampleWithFullData: IProfile = {
  id: 'ef16e20d-2980-4fd9-9cd2-9de9e9f54abc',
  patientId: 'underneath befall ethics',
  firstName: 'Sage',
  middleNames: 'loudly beautifully pish',
  lastName: 'Murray',
  membership: 'fetter synthesis',
  birthDate: dayjs('2024-02-06'),
  sex: 'whose',
  bloodGroup: 'shocked',
  mobilePhone: 'drat this simplify',
  phoneNumber: 'fondly so',
  email: 'Aubree12@gmail.com',
  cardType: 'gah given minus',
  cardNumber: 'because sedately dismal',
  contacts: 'overextend self-esteem knowledgeably',
  address: { id: 'addr-sample-2', streetAddress: 'sweetly finance' },
  team: 'reflate clasp',
  imageUrl: 'unless ruling',
  about: 'whoa stingy',
  socialHandle: 'however yuck unto',
  careAngelName: 'smother yum',
  careAngelPhone: 'trustee bowling diarist',
};

export const sampleWithNewData: NewProfile = {
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
