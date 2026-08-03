import { IPaymentOption, NewPaymentOption } from './payment-option.model';

export const sampleWithRequiredData: IPaymentOption = {
  id: '6847a616-cfa5-4a71-bcc3-27cc5c2f8425',
};

export const sampleWithPartialData: IPaymentOption = {
  id: 'f88e8fcd-c33c-4696-a297-ab234fcd0d98',
  userID: 'liner',
};

export const sampleWithFullData: IPaymentOption = {
  id: '89b9590b-8a8d-415d-b2dd-60e96870b904',
  type: 'kitchen perspire ha',
  userID: 'viciously',
  metadata: 'average pirate qua',
};

export const sampleWithNewData: NewPaymentOption = {
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
