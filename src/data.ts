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

export const INITIAL_BALANCE_REQUESTS: BalanceRequest[] = [];

export const INITIAL_ORDERS: OfferOrder[] = [];
