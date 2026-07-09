import { User, Offer, BalanceRequest, OfferOrder, AppConfig } from './types';

export const INITIAL_CONFIG: AppConfig = {
  telecomName: 'Bayzid Telecom',
  bkashNumber: '01601-202721',
  nagadNumber: '01601-202721',
  rocketNumber: '01601-202721',
  supportTelegram: 'https://t.me/bayzidtelecom_bd',
  supportWhatsapp: 'https://wa.me/8801601202721',
  supportFacebook: 'https://facebook.com/bayzidtelecom',
  supportYoutube: 'https://youtube.com/c/bayzidtelecom',
  noticeText: 'বিসমিল্লাহির রহমানির রহিম। আল্লাহ ভরসা। বায়জিদ টেলিকম-এ আপনাকে স্বাগতম! সততা আমাদের পথ, সেবা আমাদের লক্ষ্য। আমাদের সকল ড্রাইভ প্যাক চালু আছে। যেকোনো প্রয়োজনে সরাসরি আমাদের হোয়াটসঅ্যাপ হেল্পলাইনে যোগাযোগ করুন।'
};

export const INITIAL_USERS: User[] = [
  {
    id: 'user-karim',
    name: 'Karim',
    phone: '01723-999888',
    balance: 1250,
    role: 'user',
    level: 'Distributor',
    verified: true,
    deviceDetails: 'SM-G998B (Android 14)',
    password: '123456',
    pin: '1234',
    deviceLocked: false,
    twoStepEnabled: false,
    apiKey: 'dt_live_8321a4f9b0c2e3',
    language: 'English'
  },
  {
    id: 'user-johurul',
    name: 'Johurul Islam',
    phone: '01854-321098',
    balance: 450,
    role: 'user',
    level: 'Dealer',
    verified: true,
    deviceDetails: 'X90_Plus (Android 13)',
    password: '123456',
    pin: '1234',
    deviceLocked: false,
    twoStepEnabled: false,
    apiKey: 'dt_live_1922c3d8e7b1a5',
    language: 'English'
  },
  {
    id: 'admin-telecom',
    name: 'Bayzid Admin',
    phone: 'bayzidtelecom1@gmail.com',
    balance: 99999,
    role: 'admin',
    level: 'Distributor',
    verified: true,
    deviceDetails: 'Desktop Chrome',
    password: 'Bayzid@#2023',
    pin: '2023',
    deviceLocked: false,
    twoStepEnabled: true,
    apiKey: 'dt_live_9999ffeeddccbbaa',
    language: 'English'
  }
];

export const INITIAL_OFFERS: Offer[] = [
  {
    id: 'offer-1',
    operator: 'Robi',
    title: '10GB Data + 300 Min (Drive Pack)',
    description: '১০ জিবি ইন্টারনেট ও ৩০০ মিনিট টকটাইম। শুধু রবি গ্রাহকদের জন্য প্রযোজ্য।',
    validity: '30 Days',
    originalPrice: 499,
    offerPrice: 380,
    category: 'Drive Pack',
    isActive: true
  },
  {
    id: 'offer-2',
    operator: 'GP',
    title: '30GB Internet (Regular Pack)',
    description: '৩০ জিবি সুপারস্পিড ৪জি ইন্টারনেট। যেকোনো জিপি নাম্বারে দেওয়া যাবে।',
    validity: '30 Days',
    originalPrice: 650,
    offerPrice: 580,
    category: 'Regular Pack',
    isActive: true
  },
  {
    id: 'offer-3',
    operator: 'Airtel',
    title: '500 Min Talktime',
    description: '৫০০ মিনিট যেকোনো লোকাল নাম্বারে। মেয়াদ ৩০ দিন।',
    validity: '30 Days',
    originalPrice: 310,
    offerPrice: 260,
    category: 'Drive Pack',
    isActive: true
  },
  {
    id: 'offer-4',
    operator: 'Banglalink',
    title: '15GB Internet + 400 Min',
    description: '১৫ জিবি ইন্টারনেট + ৪০০ মিনিট টকটাইম। স্পেশাল বাংলালিংক ড্রাইভ অফার।',
    validity: '30 Days',
    originalPrice: 550,
    offerPrice: 420,
    category: 'Drive Pack',
    isActive: true
  },
  {
    id: 'offer-5',
    operator: 'Teletalk',
    title: '5GB Data + 150 Min',
    description: '৫ জিবি ইন্টারনেট ও ১৫০ মিনিট টকটাইম। সরকারি মেগা নেটওয়ার্ক।',
    validity: '15 Days',
    originalPrice: 199,
    offerPrice: 149,
    category: 'Regular Pack',
    isActive: true
  },
  {
    id: 'offer-6',
    operator: 'Robi',
    title: '1GB/Day (Robi Recharge)',
    description: 'প্রতিদিন ১ জিবি ইন্টারনেট। সর্বমোট ৩০ জিবি ইন্টারনেট ৩০ দিনে।',
    validity: '30 Days',
    originalPrice: 399,
    offerPrice: 315,
    category: 'Drive Pack',
    isActive: true
  },
  {
    id: 'offer-7',
    operator: 'GP',
    title: '800 Minutes Talktime',
    description: '৮০০ মিনিট যেকোনো লোকাল অপারেটরে। মেয়াদ ৩০ দিন।',
    validity: '30 Days',
    originalPrice: 507,
    offerPrice: 445,
    category: 'Drive Pack',
    isActive: true
  },
  {
    id: 'offer-8',
    operator: 'Banglalink',
    title: '40GB Data (Non-Stop)',
    description: '৪০ জিবি ফুল স্পিড ইন্টারনেট। স্পেশাল ডিল।',
    validity: '30 Days',
    originalPrice: 699,
    offerPrice: 590,
    category: 'Regular Pack',
    isActive: true
  }
];

export const INITIAL_BALANCE_REQUESTS: BalanceRequest[] = [
  {
    id: 'req-1',
    userId: 'user-karim',
    userName: 'Karim',
    amount: 1000,
    senderNumber: '01712-345678',
    transactionId: 'BKX5S389W',
    method: 'bKash',
    status: 'Approved',
    createdAt: '2026-07-05T10:30:00.000Z'
  },
  {
    id: 'req-2',
    userId: 'user-johurul',
    userName: 'Johurul Islam',
    amount: 500,
    senderNumber: '01987-654321',
    transactionId: 'NGD4F921B',
    method: 'Nagad',
    status: 'Pending',
    createdAt: '2026-07-06T08:15:00.000Z'
  },
  {
    id: 'req-3',
    userId: 'user-karim',
    userName: 'Karim',
    amount: 250,
    senderNumber: '01555-444333',
    transactionId: 'RCT2A738Q',
    method: 'Rocket',
    status: 'Pending',
    createdAt: '2026-07-06T09:45:00.000Z'
  }
];

export const INITIAL_ORDERS: OfferOrder[] = [
  {
    id: 'order-1',
    userId: 'user-karim',
    userName: 'Karim',
    offerId: 'offer-1',
    offerTitle: '10GB Data + 300 Min (Drive Pack)',
    operator: 'Robi',
    offerPrice: 380,
    targetPhone: '01811-223344',
    status: 'Successful',
    createdAt: '2026-07-05T14:20:00.000Z'
  },
  {
    id: 'order-2',
    userId: 'user-johurul',
    userName: 'Johurul Islam',
    offerId: 'offer-4',
    offerTitle: '15GB Internet + 400 Min',
    operator: 'Banglalink',
    offerPrice: 420,
    targetPhone: '01944-556677',
    status: 'Pending',
    createdAt: '2026-07-06T09:10:00.000Z'
  }
];
