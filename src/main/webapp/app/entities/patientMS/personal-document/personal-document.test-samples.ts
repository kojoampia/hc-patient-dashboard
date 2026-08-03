import dayjs from 'dayjs/esm';

import { IPersonalDocument, NewPersonalDocument } from './personal-document.model';

export const sampleWithRequiredData: IPersonalDocument = {
  id: 'c6f07db4-82e5-4b12-b2e1-75d51c09cf44',
};

export const sampleWithPartialData: IPersonalDocument = {
  id: '8c6699fa-ab50-44a2-bb53-9bdfeec7bbd3',
  category: 'hastily kindheartedly unimpressively',
  url: 'https://remarkable-vestment.net/',
  patientId: 'astride prioritise teriyaki',
  expiresOn: dayjs('2024-03-30'),
};

export const sampleWithFullData: IPersonalDocument = {
  id: '7af24032-cbcf-4cdd-ab77-384d6be94014',
  name: 'keenly',
  category: 'liability a',
  url: 'https://active-bonnet.biz',
  patientId: 'ew finally unto',
  issuedOn: dayjs('2024-03-30'),
  expiresOn: dayjs('2024-03-30'),
};

export const sampleWithNewData: NewPersonalDocument = {
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
