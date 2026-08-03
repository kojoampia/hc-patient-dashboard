import dayjs from 'dayjs/esm';
import { StatFlag } from 'app/entities/enumerations/stat-flag.model';

export interface IStat {
  id: string;
  patientId?: string | null;
  type?: string | null;
  name?: string | null;
  description?: string | null;
  value?: number | null;
  secondaryValue?: number | null;
  unit?: string | null;
  referenceLow?: number | null;
  referenceHigh?: number | null;
  flag?: keyof typeof StatFlag | null;
  note?: string | null;
  recordedAt?: dayjs.Dayjs | null;
  createdDate?: dayjs.Dayjs | null;
  createdBy?: string | null;
}

export type NewStat = Omit<IStat, 'id'> & { id: null };
