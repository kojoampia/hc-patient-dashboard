import dayjs from 'dayjs/esm';

export interface IStat {
  id: string;
  name?: string | null;
  description?: string | null;
  value?: number | null;
  note?: string | null;
  createdDate?: dayjs.Dayjs | null;
  createdBy?: string | null;
}

export type NewStat = Omit<IStat, 'id'> & { id: null };
