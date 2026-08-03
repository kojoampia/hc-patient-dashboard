import dayjs from 'dayjs/esm';
import { CarePlanType } from 'app/entities/enumerations/care-plan-type.model';

export interface ICarePlanItem {
  id: string;
  patientId?: string | null;
  planType?: keyof typeof CarePlanType | null;
  label?: string | null;
  detail?: string | null;
  cadence?: string | null;
  completed?: boolean | null;
  sortOrder?: number | null;
  createdDate?: dayjs.Dayjs | null;
  modifiedDate?: dayjs.Dayjs | null;
  createdBy?: string | null;
  modifiedBy?: string | null;
}

export type NewCarePlanItem = Omit<ICarePlanItem, 'id'> & { id: null };
