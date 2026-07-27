export type OperatorName = 'GP' | 'Robi' | 'Airtel' | 'Banglalink' | 'Special' | 'Teletalk';

export interface User {
  id: string;
  name: string;
  phone: string;
  balance: number;
  loanDue?: number;
  role: 'user' | 'admin';
  level: 'Distributor' | 'Dealer' | 'Retailer';
  verified: boolean;
  deviceDetails: string;
  password?: string;
  pin?: string;
  deviceLocked?: boolean;
  twoStepEnabled?: boolean;
  apiKey?: string;
  language?: 'English' | 'Bangla';
}

export interface LoanRecord {
  id: string;
  userId: string;
  userName: string;
  userPhone?: string;
  amount: number;
  type: 'GIVEN' | 'REPAID';
  note?: string;
  createdAt: string;
  remainingDue: number;
}

export interface Offer {
  id: string;
  operator: OperatorName;
  title: string;
  description: string;
  validity: string;
  originalPrice: number;
  offerPrice: number;
  category: 'Drive Pack' | 'Regular Pack' | 'Special Pack';
  isSpecial?: boolean;
  isActive: boolean;
}

export interface BalanceRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  senderNumber: string;
  transactionId: string;
  method: 'bKash' | 'Nagad' | 'Rocket' | 'Admin' | string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
}

export interface OfferOrder {
  id: string;
  userId: string;
  userName: string;
  offerId: string;
  offerTitle: string;
  operator: OperatorName;
  offerPrice: number;
  targetPhone: string;
  status: 'Pending' | 'Successful' | 'Canceled';
  createdAt: string;
}

export interface AppConfig {
  telecomName: string;
  bkashNumber: string;
  nagadNumber: string;
  rocketNumber: string;
  supportTelegram: string;
  supportWhatsapp: string;
  supportFacebook: string;
  supportYoutube: string;
  noticeText: string;
}

export function parseDateToMs(dateVal: any): number {
  if (!dateVal) return 0;
  if (typeof dateVal === 'number') return dateVal;
  if (typeof dateVal === 'object' && dateVal.seconds) {
    return dateVal.seconds * 1000;
  }
  if (typeof dateVal === 'string') {
    const t = new Date(dateVal).getTime();
    if (!isNaN(t)) return t;
    const match = dateVal.match(/(\d+)[/.-](\d+)[/.-](\d+)/);
    if (match) {
      const p1 = parseInt(match[1], 10);
      const p2 = parseInt(match[2], 10);
      const p3 = parseInt(match[3], 10);
      if (p3 > 1000) {
        const d1 = new Date(p3, p1 - 1, p2).getTime();
        if (!isNaN(d1)) return d1;
        const d2 = new Date(p3, p2 - 1, p1).getTime();
        if (!isNaN(d2)) return d2;
      }
    }
  }
  return 0;
}
