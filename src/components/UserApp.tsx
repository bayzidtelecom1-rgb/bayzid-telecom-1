import React, { useState, useEffect } from 'react';
import { 
  Home, 
  History, 
  Smartphone, 
  User as UserIcon, 
  HelpCircle, 
  CheckCircle, 
  Clock, 
  XCircle, 
  PhoneCall, 
  Send, 
  Share2, 
  Search, 
  AlertTriangle,
  ExternalLink,
  MessageCircle,
  Copy,
  Info,
  Menu,
  Bell,
  Award,
  Lock,
  Shield,
  Globe,
  Key,
  UserPlus,
  MessageSquare,
  Phone,
  LogOut,
  LockKeyhole,
  ShieldAlert,
  ArrowLeft,
  PlusCircle,
  MoreVertical
} from 'lucide-react';
import { User, Offer, BalanceRequest, OfferOrder, AppConfig, OperatorName } from '../types';
import { supabase } from '../lib/supabase';

interface UserAppProps {
  user: User;
  offers: Offer[];
  balanceRequests: BalanceRequest[];
  orders: OfferOrder[];
  config: AppConfig;
  onSubmitBalanceRequest: (request: Omit<BalanceRequest, 'id' | 'userId' | 'userName' | 'status' | 'createdAt'>) => void;
  onSubmitOrder: (order: Omit<OfferOrder, 'id' | 'userId' | 'userName' | 'status' | 'createdAt'>) => void;
  users: User[];
  isLoggedIn: boolean;
  setIsLoggedIn: (val: boolean) => void;
  onRegisterUser: (newUser: User) => void;
  onUpdateUser: (userId: string, fields: Partial<User>) => void;
  selectedUserId: string;
  setSelectedUserId: (id: string) => void;
  currentView?: 'user' | 'admin';
  setCurrentView?: (view: 'user' | 'admin') => void;
}

export default function UserApp({
  user,
  offers,
  balanceRequests,
  orders,
  config,
  onSubmitBalanceRequest,
  onSubmitOrder,
  users,
  isLoggedIn,
  setIsLoggedIn,
  onRegisterUser,
  onUpdateUser,
  selectedUserId,
  setSelectedUserId,
  currentView,
  setCurrentView,
}: UserAppProps) {
  const [activeScreen, setActiveScreen] = useState<'home' | 'recharge' | 'history' | 'profile'>('home');
  const [selectedOperator, setSelectedOperator] = useState<OperatorName | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'Drive Pack' | 'Regular Pack'>('Drive Pack');

  // Tap for balance state
  const [showBalance, setShowBalance] = useState(false);
  const [isTapping, setIsTapping] = useState(false);

  // Sidebar & Login / Register states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPin, setRegPin] = useState('');
  const [regLevel, setRegLevel] = useState<'Distributor' | 'Dealer' | 'Retailer'>('Dealer');
  const [authError, setAuthError] = useState('');

  // Active settings modal state
  const [currentModal, setCurrentModal] = useState<'changePin' | 'changePassword' | 'showApiKey' | 'twoStep' | 'deviceLock' | 'membership' | 'notification' | 'language' | 'refer' | 'share' | 'complain' | 'helpline' | 'privacy' | null>(null);
  
  // Settings forms states
  const [newPin, setNewPin] = useState('');
  const [newPinConfirm, setNewPinConfirm] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [complainText, setComplainText] = useState('');

  // Add Balance form state
  const [addMethod, setAddMethod] = useState<'bKash' | 'Nagad' | 'Rocket'>('bKash');
  const [addAmount, setAddAmount] = useState('');
  const [addSender, setAddSender] = useState('');
  const [addTxId, setAddTxId] = useState('');
  const [addSuccessMsg, setAddSuccessMsg] = useState(false);

  // Buy offer modal state
  const [selectedOfferForBuy, setSelectedOfferForBuy] = useState<Offer | null>(null);
  const [targetNumber, setTargetNumber] = useState('');
  const [buyError, setBuyError] = useState('');

  // Derived state: filtered offers
  const filteredOffers = offers.filter(offer => {
    if (selectedOperator !== 'All' && offer.operator !== selectedOperator) {
      return false;
    }
    if (offer.category !== activeTab) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        offer.title.toLowerCase().includes(q) ||
        offer.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('নম্বর কপি করা হয়েছে!');
  };

  const getMethodColor = (method: 'bKash' | 'Nagad' | 'Rocket') => {
    if (method === 'bKash') return 'bg-pink-600';
    if (method === 'Nagad') return 'bg-orange-500';
    return 'bg-blue-600';
  };

  // Handle balance reveal timer
  useEffect(() => {
    let timer: any;
    if (showBalance) {
      timer = setTimeout(() => {
        setShowBalance(false);
      }, 4000);
    }
    return () => clearTimeout(timer);
  }, [showBalance]);

  const handleTapBalance = () => {
    setIsTapping(true);
    setTimeout(() => {
      setIsTapping(false);
      setShowBalance(!showBalance);
    }, 300);
  };

  // Login handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!loginPhone || !loginPassword) {
      setAuthError('সবগুলো ঘর পূরণ করুন!');
      return;
    }

    // 1. HARDCODED ADMIN CREDENTIALS ROUTING (USER DIRECTIVE)
    if (loginPhone.toLowerCase().trim() === 'bayzidtelecom1@gmail.com' && loginPassword === 'Bayzid@#2023') {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: 'bayzidtelecom1@gmail.com',
          password: 'Bayzid@#2023',
        });
        
        if (!error && data.user) {
          console.log('Admin signed in successfully to Supabase Auth!');
          setSelectedUserId(data.user.id);
        } else {
          // If the admin user doesn't exist in Supabase auth yet, attempt to sign up!
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: 'bayzidtelecom1@gmail.com',
            password: 'Bayzid@#2023',
            options: {
              data: {
                password: 'Bayzid@#2023',
              }
            }
          });
          if (!signUpError && signUpData.user) {
            console.log('Admin registered successfully in Supabase Auth!');
            setSelectedUserId(signUpData.user.id);
          } else {
            console.warn('Could not register Admin in Supabase Auth:', signUpError?.message);
          }
        }
      } catch (err) {
        console.warn('Supabase Admin auth sync failed:', err);
      }

      setIsLoggedIn(true);
      setLoginPhone('');
      setLoginPassword('');
      if (setCurrentView) {
        setCurrentView('admin');
      }
      alert('Welcome back, Admin! Redirecting to Admin Dashboard...');
      return;
    }

    try {
      // 2. SUPABASE AUTH ATTEMPT
      const cleanPhone = loginPhone.replace(/[^0-9]/g, '');
      let email = loginPhone.includes('@') ? loginPhone : `${cleanPhone}@bayzidtelecom.com`;

      // Search profile first if it has a custom name prefix in the email
      if (!loginPhone.includes('@')) {
        const { data: matchedProfiles } = await supabase
          .from('users_profile')
          .select('email')
          .ilike('email', `%_${cleanPhone}@bayzidtelecom.com`);

        if (matchedProfiles && matchedProfiles.length > 0) {
          email = matchedProfiles[0].email;
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: loginPassword,
      });

      if (!error && data.user) {
        // Authenticated via Supabase Auth
        // Now wait or read profile
        const { data: profile } = await supabase
          .from('users_profile')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profile) {
          setSelectedUserId(data.user.id);
          setIsLoggedIn(true);
          setLoginPhone('');
          setLoginPassword('');
          if (profile.role === 'admin' && setCurrentView) {
            setCurrentView('admin');
          }
          return;
        }
      }
    } catch (err) {
      console.warn('Supabase Login failed or not configured, trying local database fallback...', err);
    }

    // 3. FALLBACK TO LOCAL USERS (For offline simulation & pre-loaded test accounts)
    const found = users.find(u => {
      if (u.phone.toLowerCase().trim() === loginPhone.toLowerCase().trim() && u.password === loginPassword) {
        return true;
      }
      const cleanPhone = u.phone.replace(/[^0-9]/g, '');
      const inputPhone = loginPhone.replace(/[^0-9]/g, '');
      const userPassword = u.password || '123456';
      return cleanPhone.length > 0 && cleanPhone === inputPhone && userPassword === loginPassword;
    });

    if (found) {
      setSelectedUserId(found.id);
      setIsLoggedIn(true);
      setLoginPhone('');
      setLoginPassword('');
      if (found.role === 'admin' && setCurrentView) {
        setCurrentView('admin');
      }
    } else {
      setAuthError('ভুল মোবাইল নম্বর/ইমেইল অথবা পাসওয়ার্ড! অনুগ্রহ করে আবার চেষ্টা করুন।');
    }
  };

  // Registration handler
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!regName || !regPhone || !regPassword || !regPin) {
      setAuthError('সবগুলো ঘর পূরণ করুন!');
      return;
    }

    const cleanPhone = regPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 11) {
      setAuthError('সঠিক ১১ ডিজিটের মোবাইল নাম্বার দিন!');
      return;
    }

    // Check if phone already registered locally
    const exists = users.some(u => u.phone.replace(/[^0-9]/g, '') === cleanPhone);
    if (exists) {
      setAuthError('এই মোবাইল নাম্বারটি দিয়ে ইতিপূর্বে রেজিস্ট্রেশন করা হয়েছে!');
      return;
    }

    // 1. SUPABASE AUTH REGISTER ATTEMPT
    try {
      const email = `${regName}_${cleanPhone}@bayzidtelecom.com`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password: regPassword,
        options: {
          data: {
            password: regPassword,
          }
        }
      });

      if (!error && data.user) {
        // Update profile with name prefix password, pin, level
        await supabase
          .from('users_profile')
          .update({
            password: `${regName} - ${regPassword}`,
            pin: regPin,
            level: regLevel
          })
          .eq('id', data.user.id);

        // Let's create user locally too to keep things synced
        const newUser: User = {
          id: data.user.id,
          name: regName,
          phone: regPhone,
          balance: 0,
          role: 'user',
          level: regLevel,
          verified: true,
          deviceDetails: 'Registered Web Device',
          password: regPassword,
          pin: regPin,
          deviceLocked: false,
          twoStepEnabled: false,
          apiKey: `dt_live_${Math.random().toString(36).substring(2, 16)}`,
          language: 'English'
        };

        onRegisterUser(newUser);
        setSelectedUserId(data.user.id);
        setIsLoggedIn(true);

        setRegName('');
        setRegPhone('');
        setRegPassword('');
        setRegPin('');
        setAuthError('');
        alert('Supabase-এ রেজিস্ট্রেশন সফল হয়েছে এবং আপনার অ্যাকাউন্ট লগইন করা হয়েছে!');
        return;
      } else if (error) {
        console.warn('Supabase Auth error:', error.message);
      }
    } catch (err) {
      console.warn('Supabase Registration failed or not configured, using local fallback...', err);
    }

    // 2. FALLBACK LOCAL REGISTRATION
    const randomUUID = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });

    const newUser: User = {
      id: randomUUID,
      name: regName,
      phone: regPhone,
      balance: 0,
      role: 'user',
      level: regLevel,
      verified: true,
      deviceDetails: 'SM-G998B (Android 14)',
      password: regPassword,
      pin: regPin,
      deviceLocked: false,
      twoStepEnabled: false,
      apiKey: `dt_live_${Math.random().toString(36).substring(2, 16)}`,
      language: 'English'
    };

    onRegisterUser(newUser);
    setSelectedUserId(newUser.id);
    setIsLoggedIn(true);

    setRegName('');
    setRegPhone('');
    setRegPassword('');
    setRegPin('');
    setAuthError('');
    alert('রেজিস্ট্রেশন সফল হয়েছে এবং আপনার অ্যাকাউন্ট লগইন করা হয়েছে!');
  };

  // Change PIN handler
  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin || !newPinConfirm) {
      alert('সবগুলো ঘর পূরণ করুন!');
      return;
    }
    if (newPin !== newPinConfirm) {
      alert('পিন দুটি মেলেনি!');
      return;
    }
    if (newPin.length < 4) {
      alert('পিন কমপক্ষে ৪ ডিজিটের হতে হবে!');
      return;
    }
    onUpdateUser(user.id, { pin: newPin });
    setNewPin('');
    setNewPinConfirm('');
    setCurrentModal(null);
    alert('আপনার ট্রানজেকশন পিন সফলভাবে পরিবর্তন করা হয়েছে!');
  };

  // Change Password handler
  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !newPasswordConfirm) {
      alert('সবগুলো ঘর পূরণ করুন!');
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      alert('পাসওয়ার্ড দুটি মেলেনি!');
      return;
    }
    if (newPassword.length < 6) {
      alert('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে!');
      return;
    }
    onUpdateUser(user.id, { password: newPassword });
    setNewPassword('');
    setNewPasswordConfirm('');
    setCurrentModal(null);
    alert('আপনার লগইন পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!');
  };

  // Device Lock toggle
  const handleToggleDeviceLock = () => {
    const nextVal = !user.deviceLocked;
    onUpdateUser(user.id, { deviceLocked: nextVal });
    alert(nextVal ? 'ডিভাইস লক সফলভাবে চালু করা হয়েছে! এই ডিভাইস ছাড়া অন্য কোথাও এটি লগইন হবে না।' : 'ডিভাইস লক বন্ধ করা হয়েছে।');
  };

  // Two Step toggle
  const handleToggleTwoStep = () => {
    const nextVal = !user.twoStepEnabled;
    onUpdateUser(user.id, { twoStepEnabled: nextVal });
    alert(nextVal ? 'দ্বি-স্তরের নিরাপত্তা (Two Step) সফলভাবে চালু করা হয়েছে!' : 'দ্বি-স্তরের নিরাপত্তা বন্ধ করা হয়েছে।');
  };

  // Language change
  const handleChangeLanguage = (lang: 'English' | 'Bangla') => {
    onUpdateUser(user.id, { language: lang });
    alert(`Language updated to: ${lang === 'English' ? 'English' : 'বাংলা'}`);
    setCurrentModal(null);
  };

  const handleBalanceRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addAmount || !addSender || !addTxId) {
      alert('সবগুলো ঘর পূরণ করুন!');
      return;
    }
    onSubmitBalanceRequest({
      amount: Number(addAmount),
      senderNumber: addSender,
      transactionId: addTxId.trim().toUpperCase(),
      method: addMethod
    });
    setAddSuccessMsg(true);
    // Reset form fields
    setAddAmount('');
    setAddSender('');
    setAddTxId('');
    setTimeout(() => {
      setAddSuccessMsg(false);
    }, 5000);
  };

  const handleBuyOfferConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOfferForBuy) return;
    
    // Simple validation for Bangladeshi phone numbers
    const cleanNum = targetNumber.replace(/[^0-9]/g, '');
    if (cleanNum.length < 11) {
      setBuyError('সঠিক ১১ ডিজিটের মোবাইল নাম্বার লিখুন!');
      return;
    }

    if (user.balance < selectedOfferForBuy.offerPrice) {
      setBuyError('আপনার একাউন্টে পর্যাপ্ত টাকা নেই! ব্যালেন্স রিচার্জ করুন।');
      return;
    }

    // Submit order
    onSubmitOrder({
      offerId: selectedOfferForBuy.id,
      offerTitle: selectedOfferForBuy.title,
      operator: selectedOfferForBuy.operator,
      offerPrice: selectedOfferForBuy.offerPrice,
      targetPhone: targetNumber
    });

    // Reset and success
    setSelectedOfferForBuy(null);
    setTargetNumber('');
    setBuyError('');
    alert('অফার সফলভাবষিত হয়বার করা হয়ইছব!');
  };

  return (
    <div className="bg-slate-950 min-h-screen flex flex-col items-center justify-center select-none w-full md:p-6">
      
      {/* Container: Full screen on mobile, elegant centered smartphone frame on desktop */}
      <div className="w-full flex-1 md:flex-none md:max-w-md md:h-[860px] md:rounded-[40px] md:border-[12px] md:border-slate-800 md:shadow-2xl md:relative md:overflow-hidden bg-white flex flex-col font-sans transition-all duration-300">

        {!isLoggedIn ? (
          <div className="flex-1 bg-slate-950 flex flex-col items-center justify-center text-white px-4 py-8 overflow-y-auto select-none w-full h-full">
            {/* Logo and Header */}
            <div className="flex flex-col items-center mb-6 text-center">
              <div className="w-16 h-16 rounded-full bg-yellow-500 flex items-center justify-center p-1 border-2 border-yellow-400 shadow-xl shadow-yellow-900/20 mb-3 animate-pulse">
                <div className="w-full h-full rounded-full bg-green-900 flex items-center justify-center">
                  <span className="text-2xl font-black text-yellow-400">🌱</span>
                </div>
              </div>
              <h1 id="login-brand-title" className="text-2xl font-black tracking-wider text-yellow-400 uppercase leading-none">{config.telecomName}</h1>
              <p className="text-[10px] text-green-400 font-bold tracking-widest uppercase mt-1">RESELLER PORTAL</p>
            </div>

            {/* Login/Register Card Panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative max-w-md w-full">
              <div className="absolute -top-3 left-6 px-3 py-1 bg-yellow-500 rounded-full text-[9px] font-black text-slate-950 uppercase tracking-widest shadow-md">
                {authMode === 'login' ? '🔐 RESELLER ACCESS' : '📝 REGISTER ACC'}
              </div>

              {authError && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                  <p className="font-medium">{authError}</p>
                </div>
              )}

              {authMode === 'login' ? (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Mobile Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 01723-999888"
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-green-500 transition font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Password *</label>
                      <button
                        type="button"
                        onClick={() => alert('Please contact admin to reset password: ' + config.supportWhatsapp)}
                        className="text-[9px] text-green-400 font-bold hover:underline"
                      >
                        Forgot?
                      </button>
                    </div>
                    <input
                      type="password"
                      required
                      placeholder="Enter login password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-green-500 transition"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl text-xs font-bold transition shadow-lg shadow-green-900/30 cursor-pointer mt-2"
                  >
                    লগইন করুন (Reseller Login)
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: জহিরুল ইসলাম"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-green-500 transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Mobile Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: 018xxxxxxxx"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-green-500 transition font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Password *</label>
                      <input
                        type="password"
                        required
                        placeholder="Create password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-green-500 transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">PIN *</label>
                      <input
                        type="password"
                        required
                        maxLength={4}
                        placeholder="4 digit PIN"
                        value={regPin}
                        onChange={(e) => setRegPin(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-green-500 transition font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Account Level *</label>
                    <select
                      value={regLevel}
                      onChange={(e) => setRegLevel(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-green-500 transition"
                    >
                      <option value="Distributor">Distributor</option>
                      <option value="Dealer">Dealer</option>
                      <option value="Retailer">Retailer</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-500 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-lg shadow-green-900/30 cursor-pointer mt-2"
                  >
                    রেজিস্ট্রেশন সম্পূর্ণ করুন (Sign Up)
                  </button>
                </form>
              )}

              <div className="mt-5 pt-4 border-t border-slate-800 text-center">
                {authMode === 'login' ? (
                  <p className="text-xs text-slate-400">
                    একাউন্ট নেই?{' '}
                    <button
                      onClick={() => { setAuthMode('register'); setAuthError(''); }}
                      className="text-yellow-400 font-black underline hover:text-yellow-300 ml-1 cursor-pointer"
                    >
                      রেজিস্ট্রেশন করুন
                    </button>
                  </p>
                ) : (
                  <p className="text-xs text-slate-400">
                    ইতিমধ্যে একাউন্ট আছে?{' '}
                    <button
                      onClick={() => { setAuthMode('login'); setAuthError(''); }}
                      className="text-green-400 font-black underline hover:text-green-300 ml-1 cursor-pointer"
                    >
                      লগইন করুন
                    </button>
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>

            {/* Application Header Bar */}
            <div className="bg-gradient-to-r from-green-800 via-green-700 to-green-850 text-white px-4 py-3 flex items-center justify-between shadow-md shrink-0 z-20 select-none">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-1.5 hover:bg-green-850 active:scale-95 rounded-lg transition text-white cursor-pointer mr-1"
                  title="Open Sidebar"
                >
                  <Menu className="w-5 h-5" />
                </button>

                <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center p-0.5 border border-yellow-400 shadow-md">
                  <div className="w-full h-full rounded-full bg-green-950 flex items-center justify-center">
                    <span className="text-[12px] font-black text-yellow-400">🌱</span>
                  </div>
                </div>
                <div>
                  <h1 id="app-brand-title" className="text-sm font-black tracking-tight text-yellow-400 uppercase leading-none">{config.telecomName}</h1>
                  <p className="text-[8px] text-green-200 font-extrabold tracking-wider mt-0.5">RESELLER PORTAL</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <a href={config.supportTelegram} target="_blank" rel="noreferrer" className="p-1.5 hover:bg-green-800 rounded-full transition" title="Support Telegram">
                  <PhoneCall className="w-4 h-4 text-yellow-400" />
                </a>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-black uppercase tracking-wide border border-emerald-500/30 animate-pulse">
                  Online
                </span>
                
                {/* 3-dot button to open sidebar */}
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-1.5 hover:bg-green-800 active:scale-95 rounded-lg transition text-white cursor-pointer ml-0.5"
                  title="More Options"
                >
                  <MoreVertical className="w-5 h-5 text-yellow-400" />
                </button>
              </div>
            </div>

            {/* Scrolling News Notice board */}
            <div className="bg-green-50 border-b border-green-100 px-3 py-1.5 overflow-hidden flex items-center shrink-0">
              <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded mr-2 uppercase shrink-0">নোটিশ</span>
              <div className="overflow-x-hidden relative w-full h-4">
                <div className="absolute whitespace-nowrap text-[11px] text-slate-700 font-medium animate-marquee">
                  {config.noticeText}
                </div>
              </div>
            </div>

            {/* Dynamic Screen View Content */}
            <div className="flex-1 overflow-y-auto bg-slate-50 pb-20">
          
          {/* SCREEN 1: HOME PANEL */}
          {activeScreen === 'home' && (
            <div className="p-3 space-y-4">
              
              {/* Profile welcome bar */}
              <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border-2 border-blue-500 overflow-hidden text-slate-700 font-black">
                    {user.name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="text-xs text-slate-400">Welcome back!</p>
                      <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-bold">
                        {user.level}
                      </span>
                    </div>
                    <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1">
                      {user.name}
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500 text-white" />
                    </h2>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Account Balance</p>
                  
                  {/* Tapping indicator bKash layout */}
                  <button
                    onClick={handleTapBalance}
                    className={`relative overflow-hidden mt-1 px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all duration-300 shadow-md flex items-center justify-center gap-1.5 cursor-pointer min-w-[120px] ${
                      isTapping ? 'scale-95' : ''
                    }`}
                  >
                    {showBalance ? (
                      <span className="font-extrabold animate-fade-in text-slate-50">{user.balance.toFixed(2)} Tk</span>
                    ) : (
                      <span className="font-extrabold flex items-center gap-1 animate-pulse">
                        <span className="text-[14px]">🔘</span> Tap for balance
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Grid links section */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Quick Actions</h3>
                <div className="grid grid-cols-4 gap-4 text-center">
                  
                  <button 
                    onClick={() => setActiveScreen('recharge')}
                    className="flex flex-col items-center gap-1.5 hover:scale-105 transition cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-full bg-sky-100 text-blue-600 flex items-center justify-center shadow-inner">
                      <Send className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-700">Add Balance</span>
                  </button>

                  <a 
                    href={config.supportTelegram} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex flex-col items-center gap-1.5 hover:scale-105 transition"
                  >
                    <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center shadow-inner">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-700">Telegram</span>
                  </a>

                  <a 
                    href={config.supportWhatsapp} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex flex-col items-center gap-1.5 hover:scale-105 transition"
                  >
                    <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                      <PhoneCall className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-700">WhatsApp</span>
                  </a>

                  <button 
                    onClick={() => setActiveScreen('profile')}
                    className="flex flex-col items-center gap-1.5 hover:scale-105 transition cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shadow-inner">
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-700">My Profile</span>
                  </button>

                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100">
                  <a 
                    href={config.supportFacebook} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 py-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition border border-slate-100 text-xs font-bold text-slate-700"
                  >
                    <span className="text-blue-600">📘</span> Facebook Page
                  </a>
                  <a 
                    href={config.supportYoutube} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 py-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition border border-slate-100 text-xs font-bold text-slate-700"
                  >
                    <span className="text-red-500">🔴</span> YouTube Channel
                  </a>
                </div>
              </div>

              {/* Dynamic Slides / Services banner */}
              <div className="relative rounded-2xl overflow-hidden shadow-sm h-28 bg-gradient-to-r from-blue-700 to-sky-500 p-4 text-white flex flex-col justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded bg-red-500 text-[9px] font-black uppercase tracking-widest">Mega Offer</span>
                  <h4 className="text-xs font-black mt-1 uppercase">সবচেয়ে কম মূল্যে ড্রাইভে সেরা ডিসকাউন্ট</h4>
                  <p className="text-[9px] text-blue-100 mt-0.5">১০০% গ্যারান্টিড রিচার্জ ও ইনস্ট্যান্ট ডেলিভারি!</p>
                </div>
                <div className="flex justify-between items-center text-[10px] text-blue-200">
                  <span>Support: 24/7 Available</span>
                  <span className="font-extrabold bg-white/20 px-2 py-0.5 rounded-full text-white">Today Hot Deals 🔥</span>
                </div>
              </div>

              {/* OPERATORS AND PACKS SECTION */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Select Operators</h3>
                  <span className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer" onClick={() => setSelectedOperator('All')}>Show All</span>
                </div>

                {/* Operator Selector Buttons */}
                <div className="grid grid-cols-6 gap-1.5">
                  {[
                    { id: 'All', label: 'All', icon: '🌐' },
                    { id: 'GP', label: 'GP', icon: '🔹' },
                    { id: 'Robi', label: 'Robi', icon: '🛑' },
                    { id: 'Airtel', label: 'Airtel', icon: '❤️' },
                    { id: 'Banglalink', label: 'BL', icon: '🔸' },
                    { id: 'Teletalk', label: 'Teletalk', icon: '🟢' },
                  ].map(op => (
                    <button
                      key={op.id}
                      onClick={() => setSelectedOperator(op.id as any)}
                      className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 border text-center transition cursor-pointer hover:border-blue-400 ${
                        selectedOperator === op.id 
                          ? 'bg-blue-600 text-white border-blue-500 shadow-md font-bold' 
                          : 'bg-white text-slate-700 border-slate-100 shadow-sm'
                      }`}
                    >
                      <span className="text-sm select-none">{op.icon}</span>
                      <span className="text-[10px] font-bold leading-none">{op.label}</span>
                    </button>
                  ))}
                </div>

                {/* Pack Type Tabs and Search bar */}
                <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 space-y-3">
                  <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                    {(['Drive Pack', 'Regular Pack'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                          activeTab === tab 
                            ? 'bg-blue-600 text-white shadow-sm' 
                            : 'bg-transparent text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {tab === 'Drive Pack' ? '🔥 ড্রাইভ প্যাক' : '⚡ রেগুলার প্যাক'}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="খুঁজুন (যেমন: 10GB, 30 Day...)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                {/* Offer Packages List */}
                <div className="space-y-2.5">
                  {filteredOffers.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center text-slate-400 border border-slate-100 shadow-sm">
                      <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-bold">কোন অফার পাওয়া যায়নি!</p>
                      <p className="text-[10px] text-slate-400 mt-1">দয়া করে অন্য অপারেটর বা লেখা লিখে খুঁজুন।</p>
                    </div>
                  ) : (
                    filteredOffers.map(offer => (
                      <div 
                        key={offer.id} 
                        className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100 hover:border-blue-400 transition flex flex-col justify-between gap-3"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                offer.operator === 'GP' ? 'bg-blue-100 text-blue-700' :
                                offer.operator === 'Robi' ? 'bg-red-100 text-red-700' :
                                offer.operator === 'Airtel' ? 'bg-rose-100 text-rose-700' :
                                offer.operator === 'Banglalink' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                {offer.operator}
                              </span>
                              <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-semibold">
                                {offer.validity} Validity
                              </span>
                            </div>
                            <h4 className="text-xs font-extrabold text-slate-800 mt-2">{offer.title}</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{offer.description}</p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[10px] text-slate-400 line-through block">{offer.originalPrice} Tk</span>
                            <span className="text-sm font-black text-emerald-500 block">{offer.offerPrice} Tk</span>
                            <span className="text-[9px] text-rose-500 bg-rose-50 px-1 py-0.5 rounded font-bold mt-1 inline-block">
                              Save {offer.originalPrice - offer.offerPrice} Tk
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <span>✅ Delivery inside 15m</span>
                          </span>
                          <button
                            onClick={() => setSelectedOfferForBuy(offer)}
                            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg transition-all shadow-md hover:shadow-blue-200 cursor-pointer"
                          >
                            Buy Now
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>

            </div>
          )}

          {/* SCREEN 2: ADD BALANCE (MANUAL CASH SUBMISSION) */}
          {activeScreen === 'recharge' && (
            <div className="p-4 space-y-4">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
                <h2 className="text-sm font-black text-slate-800">Add Balance (bKash/Nagad/Rocket)</h2>
                <p className="text-[11px] text-slate-400 mt-1">নিচের এডমিন একাউন্টে টাকা পাঠিয়ে ফরমটি পূরণ করুন।</p>
                
                {/* Billing lines */}
                <div className="grid grid-cols-1 gap-2.5 mt-4 text-left">
                  <div className="p-2.5 bg-pink-50 rounded-xl border border-pink-100 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-bold text-pink-700">bKash Personal Number</p>
                      <p className="text-xs font-mono font-black text-slate-800 mt-0.5">{config.bkashNumber}</p>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(config.bkashNumber)}
                      className="px-2 py-1 bg-pink-600 hover:bg-pink-700 text-white text-[9px] font-bold rounded-lg cursor-pointer"
                    >
                      Copy No
                    </button>
                  </div>

                  <div className="p-2.5 bg-orange-50 rounded-xl border border-orange-100 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-bold text-orange-700">Nagad Personal Number</p>
                      <p className="text-xs font-mono font-black text-slate-800 mt-0.5">{config.nagadNumber}</p>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(config.nagadNumber)}
                      className="px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white text-[9px] font-bold rounded-lg cursor-pointer"
                    >
                      Copy No
                    </button>
                  </div>

                  <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-bold text-blue-700">Rocket Personal Number</p>
                      <p className="text-xs font-mono font-black text-slate-800 mt-0.5">{config.rocketNumber}</p>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(config.rocketNumber)}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-bold rounded-lg cursor-pointer"
                    >
                      Copy No
                    </button>
                  </div>
                </div>
              </div>

              {/* Form submit */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Submit Transaction ID</h3>
                
                {addSuccessMsg && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-center flex flex-col items-center gap-1 animate-fade-in">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <p className="text-xs font-bold">টাকা যোগের অনুরোধ পাঠানো হয়েছে!</p>
                    <p className="text-[10px] text-slate-500">এডমিন চেক করে আপনার ব্যালেন্স যুক্ত করে দেবে।</p>
                  </div>
                )}

                <form onSubmit={handleBalanceRequestSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Select Money Agent</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['bKash', 'Nagad', 'Rocket'] as const).map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setAddMethod(m)}
                          className={`py-2 text-xs font-bold rounded-xl transition cursor-pointer border ${
                            addMethod === m 
                              ? 'bg-blue-600 border-blue-500 text-white shadow-sm' 
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Amount (Tk) *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 1000"
                      value={addAmount}
                      onChange={(e) => setAddAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sender Mobile Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 017xxxxxxxx"
                      value={addSender}
                      onChange={(e) => setAddSender(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Transaction ID (TxID) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BKX5S389W"
                      value={addTxId}
                      onChange={(e) => setAddTxId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500 uppercase"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-200 cursor-pointer"
                  >
                    Confirm Deposit Request
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* SCREEN 3: PURCHASE AND BALANCE HISTORY */}
          {activeScreen === 'history' && (
            <div className="p-4 space-y-4">
              {/* Offer Purchase list */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1">
                  <Smartphone className="w-4 h-4 text-sky-500" />
                  My Offer Purchase Orders
                </h3>

                {orders.length === 0 ? (
                  <p className="text-center text-slate-400 text-xs py-4 font-medium">কোন অফার অর্ডার করেননি এখনও।</p>
                ) : (
                  <div className="space-y-3.5 max-h-[250px] overflow-y-auto pr-1">
                    {[...orders].reverse().map(order => (
                      <div key={order.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                              order.operator === 'GP' ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'
                            }`}>
                              {order.operator}
                            </span>
                            <h4 className="text-xs font-extrabold text-slate-800 mt-1">{order.offerTitle}</h4>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black shrink-0 ${
                            order.status === 'Successful' ? 'bg-emerald-500/10 text-emerald-600' :
                            order.status === 'Canceled' ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600 animate-pulse'
                          }`}>
                            {order.status === 'Successful' && 'Successful'}
                            {order.status === 'Canceled' && 'Refunded'}
                            {order.status === 'Pending' && 'Pending'}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-200/50 pt-2">
                          <span>Target: <strong className="font-mono text-slate-800">{order.targetPhone}</strong></span>
                          <span className="font-bold text-slate-800">{order.offerPrice} Tk</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Deposit History list */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1">
                  <History className="w-4 h-4 text-blue-500" />
                  Deposit Requests Log
                </h3>

                {balanceRequests.length === 0 ? (
                  <p className="text-center text-slate-400 text-xs py-4 font-medium">কোনো ডিপোজিট অনুরোধ নেই।</p>
                ) : (
                  <div className="space-y-3.5 max-h-[250px] overflow-y-auto pr-1">
                    {[...balanceRequests].reverse().map(req => (
                      <div key={req.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition space-y-1.5">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black text-white ${getMethodColor(req.method)}`}>
                              {req.method}
                            </span>
                            <span className="text-xs font-black text-slate-800">{req.amount} Tk</span>
                          </div>
                          
                          <span className={`text-[10px] font-bold ${
                            req.status === 'Approved' ? 'text-emerald-600' :
                            req.status === 'Rejected' ? 'text-red-500' : 'text-amber-500'
                          }`}>
                            {req.status}
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-400 flex justify-between items-center font-mono">
                          <span>TxID: {req.transactionId}</span>
                          <span>Sender: {req.senderNumber}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SCREEN 4: PROFILE & SUPPORT DETAILS */}
          {activeScreen === 'profile' && (
            <div className="p-4 space-y-4">
              
              {/* Profile Card mockup from the user image */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 text-center space-y-4">
                <div className="relative w-16 h-16 mx-auto">
                  <div className="w-full h-full rounded-full bg-slate-100 border-2 border-blue-500 flex items-center justify-center text-slate-600 font-extrabold text-2xl">
                    {user.name[0]}
                  </div>
                  <CheckCircle className="w-5 h-5 text-emerald-500 fill-emerald-500 text-white absolute bottom-0 right-0" />
                </div>

                <div>
                  <h3 className="text-sm font-black text-slate-800">{user.name}</h3>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">{user.phone}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-left pt-2 border-t border-slate-100">
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <span className="text-[9px] text-slate-400 uppercase font-bold block">Account Status</span>
                    <span className="text-xs font-bold text-emerald-600">Verified Client</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <span className="text-[9px] text-slate-400 uppercase font-bold block">Reseller Level</span>
                    <span className="text-xs font-bold text-blue-600">{user.level}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-left text-[11px] text-slate-500 space-y-1">
                  <p className="font-bold text-slate-700">Device details:</p>
                  <p className="font-mono text-slate-400">{user.deviceDetails}</p>
                  <p className="text-[10px] text-slate-400">Security signature: SHA256-DeshTeleWeb</p>
                </div>
              </div>

              {/* Support Links card */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Direct Support Channels</h3>
                <div className="space-y-2">
                  <a href={config.supportTelegram} target="_blank" rel="noreferrer" className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-2">
                      <span className="text-lg">📢</span> Join Telegram Channel
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                  <a href={config.supportWhatsapp} target="_blank" rel="noreferrer" className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-2">
                      <span className="text-lg">💬</span> Contact Support WhatsApp
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                  <a href={config.supportFacebook} target="_blank" rel="noreferrer" className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-2">
                      <span className="text-lg">👥</span> Facebook Fan Community
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Dynamic Buy Offer Modal overlay */}
        {selectedOfferForBuy && (
          <div className="absolute inset-0 bg-black/60 flex items-end z-50 animate-fade-in">
            <div className="w-full bg-white rounded-t-3xl p-5 space-y-4 shadow-2xl animate-slide-up">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h3 className="text-sm font-black text-slate-800">অফারটি নিশ্চিত করুন (Buy Pack)</h3>
                <button 
                  onClick={() => { setSelectedOfferForBuy(null); setBuyError(''); }}
                  className="p-1 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 border border-slate-100">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-600">অপারেটর:</span>
                  <span className="font-extrabold text-blue-600">{selectedOfferForBuy.operator}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-600">অফার:</span>
                  <span className="font-extrabold text-slate-800">{selectedOfferForBuy.title}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-600">মূল্য:</span>
                  <span className="font-black text-emerald-600 text-sm">{selectedOfferForBuy.offerPrice} Tk</span>
                </div>
              </div>

              {buyError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-800 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                  <p>{buyError}</p>
                </div>
              )}

              <form onSubmit={handleBuyOfferConfirm} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">যেই নাম্বারে অফারটি দিবেন (Target Number) *</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: 01712345678"
                    value={targetNumber}
                    onChange={(e) => setTargetNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-mono tracking-wider focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                    <span>⚠️</span> নাম্বার ভুল হলে টাকা রিফান্ড বা অফার ফেরত আসবে না!
                  </p>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
                  <span>আপনার বর্তমান ব্যালেন্স:</span>
                  <span className="font-bold text-slate-700">{user.balance} Tk</span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Buy Offer (Tk {selectedOfferForBuy.offerPrice} কাটবে)
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Bottom Navigation Panel Bar (Sleek design) */}
        <div className="absolute bottom-0 inset-x-0 bg-white border-t border-slate-100 h-16 flex justify-around items-center px-2 z-10 shadow-lg">
          {[
            { id: 'home', label: 'Home', icon: Home },
            { id: 'recharge', label: 'Add Balance', icon: Send },
            { id: 'history', label: 'History', icon: History },
            { id: 'profile', label: 'Profile', icon: UserIcon },
          ].map(btn => {
            const Icon = btn.icon;
            const isActive = activeScreen === btn.id;
            return (
              <button
                key={btn.id}
                onClick={() => { setActiveScreen(btn.id as any); setBuyError(''); }}
                className={`flex flex-col items-center justify-center flex-1 h-full cursor-pointer transition-all duration-200 ${
                  isActive ? 'text-blue-600 scale-105' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
                <span className="text-[10px] font-extrabold mt-1">{btn.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sliding Sidebar Drawer */}
        {isSidebarOpen && (
          <div className="absolute inset-0 bg-black/60 z-40 transition-all duration-300 animate-fade-in flex">
            {/* Sidebar content */}
            <div className="w-72 bg-gradient-to-b from-green-900 via-slate-900 to-slate-950 text-white h-full flex flex-col shadow-2xl relative z-50 animate-slide-right">
              {/* Sidebar Header (Golden-Green elegant branding) */}
              <div className="p-5 border-b border-white/10 bg-green-950/40 relative">
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
                
                <div className="text-[9px] text-green-300 font-bold mb-1">বিসমিল্লাহির রহমানির রহিম</div>
                <div className="text-[11px] text-yellow-400 font-black tracking-wider uppercase mb-2">আল্লাহ ভরসা</div>
                
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center font-black text-slate-900 text-sm">
                    B
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-yellow-400 leading-tight">Bayzid Telecom</h2>
                    <p className="text-[9px] text-green-200">সততা আমাদের পথ, সেবা আমাদের লক্ষ্য</p>
                  </div>
                </div>
              </div>

              {/* Sidebar Profile Card */}
              <div className="p-4 mx-3 my-2.5 bg-white/5 rounded-xl border border-white/10 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 font-bold">Reseller Account</span>
                  <span className="px-1.5 py-0.2 rounded text-[8px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-bold">
                    {user.level}
                  </span>
                </div>
                <h3 className="text-xs font-black text-slate-100">{user.name}</h3>
                <p className="text-[10px] text-slate-400 font-mono">{user.phone}</p>
                <div className="flex justify-between items-center pt-1 mt-1 border-t border-white/5 text-[11px]">
                  <span className="text-slate-400">ব্যালেন্স (Balance):</span>
                  <span className="font-extrabold text-green-400">{user.balance.toFixed(2)} Tk</span>
                </div>
              </div>

              {/* Menu items list */}
              <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
                {[
                  { id: 'home', label: 'হোম পেজ (Home Dashboard)', icon: Home, action: () => { setActiveScreen('home'); setIsSidebarOpen(false); } },
                  { id: 'recharge', label: 'টাকা যুক্ত করুন (Add Balance)', icon: Send, action: () => { setActiveScreen('recharge'); setIsSidebarOpen(false); } },
                  { id: 'history', label: 'অর্ডার হিস্টোরি (Purchase Log)', icon: History, action: () => { setActiveScreen('history'); setIsSidebarOpen(false); } },
                  { id: 'profile', label: 'প্রোফাইল ও সাপোর্ট (My Profile)', icon: UserIcon, action: () => { setActiveScreen('profile'); setIsSidebarOpen(false); } },
                ].map(item => {
                  const Icon = item.icon;
                  const isActive = activeScreen === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={item.action}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer text-left ${
                        isActive 
                          ? 'bg-green-700/60 text-white border-l-4 border-yellow-400' 
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0 text-green-400" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}

                <div className="h-[1px] bg-white/10 my-2 mx-2" />

                {/* Security tools */}
                <button
                  onClick={() => { setCurrentModal('changePassword'); setIsSidebarOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white cursor-pointer text-left"
                >
                  <Lock className="w-4 h-4 shrink-0 text-slate-400" />
                  <span>পাসওয়ার্ড পরিবর্তন (Change Password)</span>
                </button>

                <button
                  onClick={() => { setCurrentModal('changePin'); setIsSidebarOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white cursor-pointer text-left"
                >
                  <Key className="w-4 h-4 shrink-0 text-slate-400" />
                  <span>পিন নম্বর পরিবর্তন (Change PIN)</span>
                </button>

                {/* If the user has Admin role, allow them to view Admin Console */}
                {user.role === 'admin' && setCurrentView && (
                  <button
                    onClick={() => { setCurrentView('admin'); setIsSidebarOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 bg-red-600/20 text-red-300 hover:bg-red-600/30 border border-red-500/20 rounded-xl text-xs font-bold cursor-pointer text-left mt-2"
                  >
                    <Shield className="w-4 h-4 shrink-0 text-red-400" />
                    <span>এডমিন প্যানেল (Owner Console)</span>
                  </button>
                )}
              </div>

              {/* Sidebar Footer */}
              <div className="p-4 border-t border-white/10 bg-slate-950/60 text-[10px] text-slate-400 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span>Version</span>
                  <span>v2.1 (Production)</span>
                </div>
                <button
                  onClick={() => { setIsLoggedIn(false); setIsSidebarOpen(false); }}
                  className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>লগ আউট (Sign Out)</span>
                </button>
              </div>
            </div>

            {/* Click outside to close */}
            <div className="flex-1" onClick={() => setIsSidebarOpen(false)} />
          </div>
        )}

        {/* Dynamic Modal manager */}
        {currentModal && (
          <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-xs bg-white rounded-2xl p-5 space-y-4 shadow-2xl relative">
              <button 
                onClick={() => setCurrentModal(null)}
                className="absolute top-3 right-3 p-1 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>

              {currentModal === 'changePassword' && (
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-800 uppercase">পাসওয়ার্ড পরিবর্তন করুন</h3>
                  <form onSubmit={handleChangePasswordSubmit} className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">নতুন পাসওয়ার্ড *</label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        placeholder="কমপক্ষে ৬ ডিজিট"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">নিশ্চিত করুন *</label>
                      <input
                        type="password"
                        required
                        placeholder="আবার টাইপ করুন"
                        value={newPasswordConfirm}
                        onChange={(e) => setNewPasswordConfirm(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-green-500"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      পাসওয়ার্ড আপডেট করুন
                    </button>
                  </form>
                </div>
              )}

              {currentModal === 'changePin' && (
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-800 uppercase">পিন নম্বর পরিবর্তন করুন</h3>
                  <form onSubmit={handleChangePinSubmit} className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">নতুন পিন *</label>
                      <input
                        type="password"
                        required
                        maxLength={4}
                        placeholder="৪ ডিজিটের নম্বর"
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-mono tracking-widest focus:outline-none focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">নিশ্চিত করুন *</label>
                      <input
                        type="password"
                        required
                        maxLength={4}
                        placeholder="আবার টাইপ করুন"
                        value={newPinConfirm}
                        onChange={(e) => setNewPinConfirm(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-mono tracking-widest focus:outline-none focus:border-green-500"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      পিন নম্বর আপডেট করুন
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

      </>
    )}

      </div>

    </div>
  );
}
