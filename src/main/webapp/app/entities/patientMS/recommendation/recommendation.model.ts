import { IClinicalCase } from 'app/entities/patientMS/clinical-case/clinical-case.model';

export interface IRecommendation {
  id: string;
  label?: string | null;
  category?: string | null;
  clinicalCases?: IClinicalCase[] | null;
}

export type NewRecommendation = Omit<IRecommendation, 'id'> & { id: null };
