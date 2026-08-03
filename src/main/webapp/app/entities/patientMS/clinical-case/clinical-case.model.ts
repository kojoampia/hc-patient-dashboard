import dayjs from 'dayjs/esm';
import { IRecommendation } from 'app/entities/patientMS/recommendation/recommendation.model';
import { CaseStatus } from 'app/entities/enumerations/case-status.model';

export interface IClinicalCase {
  id: string;
  patientId?: string | null;
  caseNumber?: number | null;
  title?: string | null;
  openedAt?: dayjs.Dayjs | null;
  closedAt?: dayjs.Dayjs | null;
  brief?: string | null;
  status?: keyof typeof CaseStatus | null;
  symptoms?: string | null;
  diagnosis?: string | null;
  assignedProfessionalId?: string | null;
  assignedRosterId?: string | null;
  recommendations?: IRecommendation[] | null;
}

export type NewClinicalCase = Omit<IClinicalCase, 'id'> & { id: null };
