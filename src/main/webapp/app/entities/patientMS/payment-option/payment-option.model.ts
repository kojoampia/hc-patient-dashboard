export interface IPaymentOption {
  id: string;
  type?: string | null;
  userID?: string | null;
  metadata?: string | null;
}

export type NewPaymentOption = Omit<IPaymentOption, 'id'> & { id: null };
