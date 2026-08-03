import dayjs from 'dayjs/esm';

export interface IPersonalDocument {
  id: string;
  name?: string | null;
  category?: string | null;
  url?: string | null;
  patientId?: string | null;
  issuedOn?: dayjs.Dayjs | null;
  expiresOn?: dayjs.Dayjs | null;
}

export type NewPersonalDocument = Omit<IPersonalDocument, 'id'> & { id: null };
