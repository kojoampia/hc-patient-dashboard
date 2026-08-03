import { IRecommendation, NewRecommendation } from './recommendation.model';

export const sampleWithRequiredData: IRecommendation = {
  id: 'a325efb4-0c00-4235-987b-47611ab5fd7f',
};

export const sampleWithPartialData: IRecommendation = {
  id: 'c5d25a37-c648-4de0-a2c1-e49c877edd48',
};

export const sampleWithFullData: IRecommendation = {
  id: '4bc6bcb3-952d-44ae-9c20-3ea4a09a9d70',
  label: 'given consequently',
  category: 'briskly',
};

export const sampleWithNewData: NewRecommendation = {
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
