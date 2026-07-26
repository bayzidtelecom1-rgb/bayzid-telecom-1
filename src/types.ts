export type OperatorName = 'GP' | 'Robi' | 'Airtel' | 'Banglalink' | 'Special' | 'Teletalk';

export interface User {
  id: string;
  name: string;
  phone: string;
  balance: number;
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
