import dayjs from 'dayjs/esm';

export interface IProfessional {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  role?: string | null;
  specialty?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  imageUrl?: string | null;
  initials?: string | null;
  location?: string | null;
  teamId?: string | null;
  createdDate?: dayjs.Dayjs | null;
  modifiedDate?: dayjs.Dayjs | null;
  createdBy?: string | null;
  modifiedBy?: string | null;
}

export type NewProfessional = Omit<IProfessional, 'id'> & { id: null };
