export type CustomerType = 'company' | 'individual';
export type StampMethod = 'signature' | 'upload' | 'contact';
export type PlanType = 'plan1' | 'plan2' | 'plan3' | 'plan4';
export type AddonType = 'addon1' | 'addon2' | 'addon3';

export interface FormData {
  customerType: CustomerType;
  companyName?: string;
  taxId?: string;
  individualName?: string;
  companyAddress: string;
  website?: string;
  contactName: string;
  phone: string;
  email: string;
  invoiceEmail: string;
  selectedPlan: PlanType;
  addons: AddonType[];
  multiStore: boolean;
  additionalStores?: number;
  stampMethod: StampMethod;
  signature?: string;
  stampFile?: string;
  agreeTerms: boolean;
  driveFolder?: string;
}

export interface PriceCalculation {
  planPrice: number;
  addonPrice: number;
  multiStorePrice: number;
  totalPrice: number;
}
