import React, { useState, useEffect } from 'react';
import { 
  INITIAL_CONFIG, 
  INITIAL_USERS, 
  INITIAL_OFFERS, 
  INITIAL_BALANCE_REQUESTS, 
  INITIAL_ORDERS 
} from './data';
import { User, Offer, BalanceRequest, OfferOrder, AppConfig } from './types';
import UserApp from './components/UserApp';
import AdminPanel from './components/AdminPanel';
import { supabase } from './lib/supabase';
import {
  fetchAppSettings,
  updateAppSettings,
  fetchDriveOffers,
  createDriveOffer,
  updateDriveOffer,
  deleteDriveOffer,
  fetchUsersProfiles,
  updateUserProfile,
  fetchDeposits,
  createDepositRequest,
  approveDepositRequest,
  rejectDepositRequest,
  fetchOrders,
  purchaseOfferRPC,
  completeOrder,
  cancelAndRefundOrderRPC
} from './lib/supabaseService';

export default function App() {
  // Load state from local storage or fallback to initial seed data
  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem('bayzid_telecom_config');
    return saved ? JSON.parse(saved) : INITIAL_CONFIG;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('bayzid_telecom_users_v2');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [offers, setOffers] = useState<Offer[]>(() => {
    const saved = localStorage.getItem('bayzid_telecom_offers');
    return saved ? JSON.parse(saved) : INITIAL_OFFERS;
  });

  const [balanceRequests, setBalanceRequests] = useState<BalanceRequest[]>(() => {
    const saved = localStorage.getItem('bayzid_telecom_balance_requests');
    return saved ? JSON.parse(saved) : INITIAL_BALANCE_REQUESTS;
  });

  const [orders, setOrders] = useState<OfferOrder[]>(() => {
    const saved = localStorage.getItem('bayzid_telecom_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  // Session state — restores a logged-in session across page refreshes,
  // but starts logged-out for anyone visiting the site for the first time.
  const [selectedUserId, setSelectedUserId] = useState<string>(() => {
    return localStorage.getItem('bayzid_telecom_session_user') || '';
  });
  const [currentView, setCurrentView] = useState<'user' | 'admin'>(() => {
    return (localStorage.getItem('bayzid_telecom_session_view') as 'user' | 'admin') || 'user';
  });
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return !!localStorage.getItem('bayzid_telecom_session_user');
  });
  const [isDbConnected, setIsDbConnected] = useState<boolean | null>(null);

  // Persist the session so a page refresh (or reopening the site) keeps the user logged in
  useEffect(() => {
    if (isLoggedIn && selectedUserId) {
      localStorage.setItem('bayzid_telecom_session_user', selectedUserId);
      localStorage.setItem('bayzid_telecom_session_view', currentView);
    } else {
      localStorage.removeItem('bayzid_telecom_session_user');
      localStorage.removeItem('bayzid_telecom_session_view');
    }
  }, [isLoggedIn, selectedUserId, currentView]);

  // Load and synchronize data with Supabase in real-time
  const loadAllData = async () => {
    try {
      const dbConfig = await fetchAppSettings();
      setConfig(dbConfig);

      const dbOffers = await fetchDriveOffers();
      if (dbOffers && dbOffers.length > 0) {
        setOffers(dbOffers);
      }

      const dbUsers = await fetchUsersProfiles();
      if (dbUsers && dbUsers.length > 0) {
        setUsers(dbUsers);
      }

      const dbDeposits = await fetchDeposits();
      if (dbDeposits && dbDeposits.length > 0) {
        setBalanceRequests(dbDeposits);
      }

      const dbOrders = await fetchOrders();
      if (dbOrders && dbOrders.length > 0) {
        setOrders(dbOrders);
      }
      setIsDbConnected(true);
    } catch (err) {
      console.warn('Error loading real-time Supabase data, utilizing local persistence fallback:', err);
      setIsDbConnected(false);
    }
  };

  useEffect(() => {
    loadAllData();

    // Subscribe to real-time events on Supabase
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, () => { loadAllData(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drive_offers' }, () => { loadAllData(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users_profile' }, () => { loadAllData(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deposits' }, () => { loadAllData(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => { loadAllData(); })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleRegisterUser = (newUser: User) => {
    setUsers(prev => {
      const updated = [...prev, newUser];
      localStorage.setItem('bayzid_telecom_users_v2', JSON.stringify(updated));
      return updated;
    });
  };

  const handleUpdateUser = async (userId: string, updatedFields: Partial<User>) => {
    // Optimistic UI update
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updatedFields } : u));
    
    // Remote database write
    const success = await updateUserProfile(userId, updatedFields);
    if (success) {
      loadAllData();
    } else {
      console.warn('Local update only (Supabase not connected/configured)');
    }
  };

  // Save changes to localStorage whenever state changes as secondary offline cache
  useEffect(() => {
    localStorage.setItem('bayzid_telecom_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('bayzid_telecom_users_v2', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('bayzid_telecom_offers', JSON.stringify(offers));
  }, [offers]);

  useEffect(() => {
    localStorage.setItem('bayzid_telecom_balance_requests', JSON.stringify(balanceRequests));
  }, [balanceRequests]);

  useEffect(() => {
    localStorage.setItem('bayzid_telecom_orders', JSON.stringify(orders));
  }, [orders]);

  // Currently logged-in user (or a harmless placeholder while logged out)
  const activeUser = users.find(u => u.id === selectedUserId) || {
    id: 'guest',
    name: 'Guest',
    phone: '',
    balance: 0,
    role: 'user' as const,
    level: 'Retailer' as const,
    verified: false,
    deviceDetails: 'Web Browser'
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setSelectedUserId('');
    setCurrentView('user');
  };

  // Callback: User submits manual cash balance request
  const handleSubmitBalanceRequest = async (req: Omit<BalanceRequest, 'id' | 'userId' | 'userName' | 'status' | 'createdAt'>) => {
    const newRequest: BalanceRequest = {
      ...req,
      id: `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: activeUser.id,
      userName: activeUser.name,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };
    
    // Optimistic UI
    setBalanceRequests(prev => [newRequest, ...prev]);

    try {
      const success = await createDepositRequest(activeUser.id, req.method, req.amount, req.senderNumber, req.transactionId);
      if (success) {
        loadAllData();
      }
    } catch (err) {
      console.warn('Supabase not connected. Running offline-local balance request...');
    }
  };

  // Callback: User places a new SIM package order
  const handleSubmitOrder = async (order: Omit<OfferOrder, 'id' | 'userId' | 'userName' | 'status' | 'createdAt'>) => {
    const newOrder: OfferOrder = {
      ...order,
      id: `order-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: activeUser.id,
      userName: activeUser.name,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    // Optimistic update
    setUsers(prevUsers => prevUsers.map(u => {
      if (u.id === activeUser.id) {
        return { ...u, balance: Math.max(0, u.balance - order.offerPrice) };
      }
      return u;
    }));
    setOrders(prev => [newOrder, ...prev]);

    try {
      const res = await purchaseOfferRPC(activeUser.id, order.offerId, order.targetPhone, order.offerPrice);
      if (res.success) {
        loadAllData();
      } else {
        alert(`Supabase RPC transaction error: ${res.error || 'Check database connectivity.'}`);
        loadAllData(); // reset balance and state to match database truth
      }
    } catch (err) {
      console.warn('Supabase offline. Handled transaction on local state.');
    }
  };

  // Callback: Admin approves deposit request
  const handleApproveBalance = async (id: string) => {
    const request = balanceRequests.find(r => r.id === id);
    if (!request || request.status !== 'Pending') return;

    // Optimistic
    setBalanceRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'Approved' } : r));
    setUsers(prevUsers => prevUsers.map(u => {
      if (u.id === request.userId) {
        return { ...u, balance: u.balance + request.amount };
      }
      return u;
    }));

    const success = await approveDepositRequest(id, request.amount);
    if (success) {
      loadAllData();
    } else {
      console.warn('Local update only (Supabase offline)');
    }
  };

  // Callback: Admin rejects deposit request
  const handleRejectBalance = async (id: string) => {
    setBalanceRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'Rejected' } : r));

    const success = await rejectDepositRequest(id);
    if (success) {
      loadAllData();
    } else {
      console.warn('Local update only (Supabase offline)');
    }
  };

  // Callback: Admin adds a new offer pack
  const handleAddOffer = async (newOffer: Omit<Offer, 'id' | 'isActive'>) => {
    const createdLocal: Offer = {
      ...newOffer,
      id: `offer-${Date.now()}`,
      isActive: true
    };
    setOffers(prev => [...prev, createdLocal]);

    const res = await createDriveOffer({ ...newOffer, isActive: true });
    if (res) {
      loadAllData();
    } else {
      console.warn('Local update only (Supabase offline)');
    }
  };

  // Callback: Admin deletes an offer pack
  const handleDeleteOffer = async (id: string) => {
    setOffers(prev => prev.filter(o => o.id !== id));

    const success = await deleteDriveOffer(id);
    if (success) {
      loadAllData();
    } else {
      console.warn('Local update only (Supabase offline)');
    }
  };

  // Callback: Admin toggles offer active status
  const handleToggleOfferStatus = async (id: string) => {
    setOffers(prev => prev.map(o => o.id === id ? { ...o, isActive: !o.isActive } : o));

    const offer = offers.find(o => o.id === id);
    if (offer) {
      const success = await updateDriveOffer(id, { isActive: !offer.isActive });
      if (success) {
        loadAllData();
      } else {
        console.warn('Local update only (Supabase offline)');
      }
    }
  };

  // Callback: Admin dispatches / completes SIM order
  const handleCompleteOrder = async (id: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'Successful' } : o));

    const success = await completeOrder(id);
    if (success) {
      loadAllData();
    } else {
      console.warn('Local update only (Supabase offline)');
    }
  };

  // Callback: Admin cancels SIM order and refunds money to reseller's wallet
  const handleCancelOrder = async (id: string) => {
    const order = orders.find(o => o.id === id);
    if (!order || order.status !== 'Pending') return;

    // Refund client wallet locally
    setUsers(prevUsers => prevUsers.map(u => {
      if (u.id === order.userId) {
        return { ...u, balance: u.balance + order.offerPrice };
      }
      return u;
    }));
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'Canceled' } : o));

    const success = await cancelAndRefundOrderRPC(id, order.offerPrice);
    if (success) {
      loadAllData();
      alert(`Order refunded successfully! ${order.offerPrice} Tk returned to ${order.userName}'s wallet via Supabase RPC.`);
    } else {
      alert(`Order refunded locally! ${order.offerPrice} Tk returned to ${order.userName}'s wallet.`);
    }
  };

  // Callback: Admin updates general branding settings
  const handleUpdateConfig = async (newConfig: AppConfig) => {
    setConfig(newConfig);

    const success = await updateAppSettings(newConfig);
    if (success) {
      loadAllData();
    } else {
      console.warn('Local update only (Supabase offline)');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <div className="flex-1">
        {currentView === 'admin' && isLoggedIn ? (
          <AdminPanel
            users={users}
            offers={offers}
            balanceRequests={balanceRequests}
            orders={orders}
            config={config}
            onApproveBalance={handleApproveBalance}
            onRejectBalance={handleRejectBalance}
            onAddOffer={handleAddOffer}
            onDeleteOffer={handleDeleteOffer}
            onToggleOfferStatus={handleToggleOfferStatus}
            onCompleteOrder={handleCompleteOrder}
            onCancelOrder={handleCancelOrder}
            onUpdateConfig={handleUpdateConfig}
            onUpdateUser={handleUpdateUser}
            onLogout={handleLogout}
          />
        ) : (
          <UserApp
            user={activeUser}
            offers={offers}
            balanceRequests={balanceRequests}
            orders={orders}
            config={config}
            onSubmitBalanceRequest={handleSubmitBalanceRequest}
            onSubmitOrder={handleSubmitOrder}
            users={users}
            isLoggedIn={isLoggedIn}
            setIsLoggedIn={setIsLoggedIn}
            onRegisterUser={handleRegisterUser}
            onUpdateUser={handleUpdateUser}
            selectedUserId={selectedUserId}
            setSelectedUserId={setSelectedUserId}
            currentView={currentView}
            setCurrentView={setCurrentView}
          />
        )}
      </div>
    </div>
  );
}
