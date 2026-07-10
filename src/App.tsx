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
import { Shield, Sparkles, Smartphone, LogOut, CheckCircle, SmartphoneIcon, User as UserIcon, Settings, Plus, RotateCcw } from 'lucide-react';
import { onSnapshot, collection } from 'firebase/firestore';
import { db } from './lib/firebase';
import {
  fetchAppSettings,
  updateAppSettings,
  fetchDriveOffers,
  createDriveOffer,
  updateDriveOffer,
  deleteDriveOffer,
  fetchUsersProfiles,
  updateUserProfile,
  createUserProfile,
  fetchDeposits,
  createDepositRequest,
  approveDepositRequest,
  rejectDepositRequest,
  fetchOrders,
  purchaseOfferRPC,
  completeOrder,
  cancelAndRefundOrderRPC,
  adminCreateUser,
  deleteAllOrders,
  deleteAllDeposits,
  deleteAllUsersExceptAdmin
} from './lib/firebaseService';

const isSupabaseConfigured = () => true;
const checkSupabaseConnection = async () => ({ success: true, message: 'Connected to Firebase' });


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

  const [selectedUserId, setSelectedUserId] = useState<string>('00000000-0000-0000-0000-000000000000');
  const [currentView, setCurrentView] = useState<'user' | 'admin'>('user');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isDbConnected, setIsDbConnected] = useState<boolean | null>(null);

  // Load and synchronize data with Supabase in real-time
  const loadAllData = async () => {
    if (!isSupabaseConfigured()) {
      setIsDbConnected(false);
      return;
    }

    try {
      const conn = await checkSupabaseConnection();
      if (!conn.success) {
        console.warn('Supabase database connection failed:', conn.message);
        setIsDbConnected(false);
        return;
      }

      const dbConfig = await fetchAppSettings();
      if (dbConfig) {
        setConfig(dbConfig);
      }

      const dbOffers = await fetchDriveOffers();
      if (dbOffers) {
        setOffers(dbOffers);
      }

      const dbUsers = await fetchUsersProfiles();
      if (dbUsers) {
        setUsers(dbUsers);
      }

      const dbDeposits = await fetchDeposits();
      if (dbDeposits) {
        setBalanceRequests(dbDeposits);
      }

      const dbOrders = await fetchOrders();
      if (dbOrders) {
        setOrders(dbOrders);
      }

      setIsDbConnected(true);
    } catch (err) {
      console.warn('Error loading real-time Firebase data, utilizing local persistence fallback:', err);
      setIsDbConnected(false);
    }
  };

  useEffect(() => {
    // One-time cleanup of local storage demo data to satisfy the user's purge request
    const hasCleaned = localStorage.getItem('bayzid_telecom_demo_cleaned_v9');
    if (!hasCleaned) {
      localStorage.removeItem('bayzid_telecom_orders');
      localStorage.removeItem('bayzid_telecom_balance_requests');
      localStorage.removeItem('bayzid_telecom_users_v2');
      localStorage.setItem('bayzid_telecom_demo_cleaned_v9', 'true');
      window.location.reload();
      return;
    }

    loadAllData();

    // Subscribe to real-time events on Firebase Firestore
    const unsubSettings = onSnapshot(collection(db, 'settings'), () => { loadAllData(); });
    const unsubOffers = onSnapshot(collection(db, 'offers'), () => { loadAllData(); });
    const unsubUsers = onSnapshot(collection(db, 'users'), () => { loadAllData(); });
    const unsubDeposits = onSnapshot(collection(db, 'deposits'), () => { loadAllData(); });
    const unsubOrders = onSnapshot(collection(db, 'orders'), () => { loadAllData(); });

    return () => {
      unsubSettings();
      unsubOffers();
      unsubUsers();
      unsubDeposits();
      unsubOrders();
    };
  }, []);

  const handleRegisterUser = async (newUser: User) => {
    setUsers(prev => {
      const updated = [...prev, newUser];
      localStorage.setItem('bayzid_telecom_users_v2', JSON.stringify(updated));
      return updated;
    });

    try {
      await createUserProfile(newUser);
    } catch (err) {
      console.warn('Could not save user profile to database (Firebase not connected)', err);
    }
  };

  const handleUpdateUser = async (userId: string, updatedFields: Partial<User>) => {
    // Optimistic UI update
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updatedFields } : u));
    
    // Remote database write
    const success = await updateUserProfile(userId, updatedFields);
    if (success) {
      loadAllData();
    } else {
      console.warn('Local update only (Firebase not connected/configured)');
    }
  };

  // New demo user creation form modal state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserLevel, setNewUserLevel] = useState<'Distributor' | 'Dealer' | 'Retailer'>('Dealer');

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

  // Find currently simulated user details
  const activeUser = users.find(u => u.id === selectedUserId) || users[0] || {
    id: 'guest',
    name: 'Guest',
    phone: '01700000000',
    balance: 0,
    role: 'user',
    level: 'Retailer',
    verified: true,
    deviceDetails: 'Web Browser'
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

  // Reset simulator to defaults
  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all data back to the original demo values?')) {
      localStorage.removeItem('bayzid_telecom_config');
      localStorage.removeItem('bayzid_telecom_users_v2');
      localStorage.removeItem('bayzid_telecom_offers');
      localStorage.removeItem('bayzid_telecom_balance_requests');
      localStorage.removeItem('bayzid_telecom_orders');
      
      setConfig(INITIAL_CONFIG);
      setUsers(INITIAL_USERS);
      setOffers(INITIAL_OFFERS);
      setBalanceRequests(INITIAL_BALANCE_REQUESTS);
      setOrders(INITIAL_ORDERS);
      setSelectedUserId(INITIAL_USERS[0].id);
      setCurrentView('user');
      alert('Data reset to defaults successfully.');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserPhone) return;

    const defaultPass = '123456';
    const defaultPin = '1234';

    const createdLocal: User = {
      id: `temp-${Date.now()}`,
      name: newUserName,
      phone: newUserPhone,
      balance: 0,
      role: 'user',
      level: newUserLevel,
      verified: true,
      deviceDetails: 'Registered Device',
      password: defaultPass,
      pin: defaultPin
    };

    // Optimistic update
    setUsers(prev => [...prev, createdLocal]);
    setNewUserName('');
    setNewUserPhone('');
    setShowAddUserModal(false);

    try {
      const createdUser = await adminCreateUser(newUserName, newUserPhone, newUserLevel, defaultPass, defaultPin);
      if (createdUser) {
        setSelectedUserId(createdUser.id);
        alert(`New Reseller Client "${newUserName}" created successfully in Supabase Database!`);
        loadAllData();
      } else {
        alert(`New Reseller Client "${newUserName}" created locally.`);
      }
    } catch (err) {
      console.warn('Error in handleCreateUser remote create:', err);
      alert(`New Reseller Client "${newUserName}" created locally.`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      
      {/* RENDER ACTIVE SCREEN */}
      <div className="flex-1">
        {currentView === 'user' ? (
          <div className="w-full">
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
          </div>
        ) : (
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
            onLogout={() => {
              setIsLoggedIn(false);
              setCurrentView('user');
            }}
             onDeleteAllOrders={async () => {
              const success = await deleteAllOrders();
              if (success) {
                setOrders([]);
                localStorage.removeItem('bayzid_telecom_orders');
                await loadAllData();
                alert('All order data has been permanently deleted from Database and Local Cache!');
              } else {
                alert('Could not delete orders from database (Firebase offline/error).');
              }
            }}
            onDeleteAllDeposits={async () => {
              const success = await deleteAllDeposits();
              if (success) {
                setBalanceRequests([]);
                localStorage.removeItem('bayzid_telecom_balance_requests');
                await loadAllData();
                alert('All deposit request data has been permanently deleted from Database and Local Cache!');
              } else {
                alert('Could not delete deposit requests from database (Firebase offline/error).');
              }
            }}
            onDeleteAllUsers={async () => {
              const success = await deleteAllUsersExceptAdmin();
              if (success) {
                setUsers(prev => prev.filter(u => u.role === 'admin'));
                localStorage.removeItem('bayzid_telecom_users_v2');
                await loadAllData();
                alert('All reseller users (except Admin) have been permanently deleted from Database and Local Cache!');
              } else {
                alert('Could not delete reseller users from database (Firebase offline/error).');
              }
            }}
          />
        )}
      </div>

      {/* ADD NEW USER MODAL MODAL */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Create New Reseller Client</h3>
            <p className="text-xs text-slate-400">Instantly register a brand new reseller client to test independent client balances and order dispatch records.</p>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Client Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahim Miah"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Reseller Mobile Line *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 01822-111000"
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Reseller Clearance Level</label>
                <select
                  value={newUserLevel}
                  onChange={(e) => setNewUserLevel(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Distributor">Distributor</option>
                  <option value="Dealer">Dealer</option>
                  <option value="Retailer">Retailer</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-650 text-slate-300 hover:text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Create Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Persistent global notice/footer */}
      <footer className="bg-slate-950 border-t border-slate-800 text-center py-4 text-[11px] text-slate-500">
        <p>© 2026 {config.telecomName} Platform • Designed for hybrid Android APK conversion.</p>
      </footer>
    </div>
  );
}
