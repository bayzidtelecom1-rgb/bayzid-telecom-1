import React, { useState } from 'react';
import { 
  Users, 
  PlusCircle, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  CreditCard, 
  ShieldAlert, 
  Smartphone, 
  Settings, 
  Search, 
  Clock, 
  Check, 
  Trash2, 
  Plus, 
  Globe, 
  MessageSquare, 
  FileText,
  DollarSign,
  Volume2,
  VolumeX,
  Bell,
  BellRing,
  LogOut
} from 'lucide-react';
import { User, Offer, BalanceRequest, OfferOrder, AppConfig, OperatorName } from '../types';

interface AdminPanelProps {
  users: User[];
  offers: Offer[];
  balanceRequests: BalanceRequest[];
  orders: OfferOrder[];
  config: AppConfig;
  onApproveBalance: (id: string) => void;
  onRejectBalance: (id: string) => void;
  onAddOffer: (offer: Omit<Offer, 'id' | 'isActive'>) => void;
  onDeleteOffer: (id: string) => void;
  onToggleOfferStatus: (id: string) => void;
  onCompleteOrder: (id: string) => void;
  onCancelOrder: (id: string) => void;
  onUpdateConfig: (newConfig: AppConfig) => void;
  onUpdateUser?: (userId: string, fields: Partial<User>) => void;
  onLogout?: () => void;
}

export default function AdminPanel({
  users,
  offers,
  balanceRequests,
  orders,
  config,
  onApproveBalance,
  onRejectBalance,
  onAddOffer,
  onDeleteOffer,
  onToggleOfferStatus,
  onCompleteOrder,
  onCancelOrder,
  onUpdateConfig,
  onUpdateUser,
  onLogout,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'approvals' | 'offers' | 'orders' | 'settings'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Offer Form state
  const [offerOperator, setOfferOperator] = useState<OperatorName>('GP');
  const [offerTitle, setOfferTitle] = useState('');
  const [offerDescription, setOfferDescription] = useState('');
  const [offerValidity, setOfferValidity] = useState('30 Days');
  const [offerOriginalPrice, setOfferOriginalPrice] = useState('');
  const [offerOfferPrice, setOfferOfferPrice] = useState('');
  const [offerCategory, setOfferCategory] = useState<'Drive Pack' | 'Regular Pack'>('Drive Pack');

  // Config Form state
  const [tempConfig, setTempConfig] = useState<AppConfig>({ ...config });

  React.useEffect(() => {
    setTempConfig({ ...config });
  }, [config]);

  // User editing state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editBalance, setEditBalance] = useState('');
  const [editLevel, setEditLevel] = useState<'Distributor' | 'Dealer' | 'Retailer'>('Dealer');
  const [editPassword, setEditPassword] = useState('');
  const [editPin, setEditPin] = useState('');

  const handleStartEditUser = (user: User) => {
    setEditingUserId(user.id);
    setEditBalance(user.balance.toString());
    setEditLevel(user.level);
    setEditPassword(user.password || '123456');
    setEditPin(user.pin || '1234');
  };

  const handleSaveUserEdit = (userId: string) => {
    if (onUpdateUser) {
      onUpdateUser(userId, {
        balance: Number(editBalance) || 0,
        level: editLevel,
        password: editPassword,
        pin: editPin
      });
      setEditingUserId(null);
      alert('Reseller client account updated successfully!');
    }
  };

  // Calculation variables
  const totalBalance = users.reduce((sum, u) => sum + (u.role === 'user' ? u.balance : 0), 0);
  const pendingApprovalsCount = balanceRequests.filter(r => r.status === 'Pending').length;
  const pendingOrdersCount = orders.filter(o => o.status === 'Pending').length;
  const completedSalesTotal = orders
    .filter(o => o.status === 'Successful')
    .reduce((sum, o) => sum + o.offerPrice, 0);

  // Automatic Sound Notification Alarm System
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const totalPending = pendingApprovalsCount + pendingOrdersCount;
  const lastTotalPendingRef = React.useRef(0);

  const triggerAlarmSound = React.useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const playBeep = (startTime: number, duration: number) => {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, startTime); // D5
        
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(659.25, startTime); // E5
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
        gainNode.gain.setValueAtTime(0.15, startTime + duration - 0.05);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
        
        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc1.start(startTime);
        osc2.start(startTime);
        osc1.stop(startTime + duration);
        osc2.stop(startTime + duration);
      };

      // Play "ring-ring... ring-ring... ring-ring..." telephone ring sequence
      playBeep(ctx.currentTime + 0.0, 0.35);
      playBeep(ctx.currentTime + 0.5, 0.35);
      
      playBeep(ctx.currentTime + 1.3, 0.35);
      playBeep(ctx.currentTime + 1.8, 0.35);

      playBeep(ctx.currentTime + 2.6, 0.35);
      playBeep(ctx.currentTime + 3.1, 0.35);
    } catch (e) {
      console.warn('Audio playback blocked or failed. Need user interaction first.', e);
    }
  }, [soundEnabled]);

  // Effect to ring immediately when a new pending item is received, and periodically every 3 minutes
  React.useEffect(() => {
    if (totalPending <= 0) {
      lastTotalPendingRef.current = 0;
      return;
    }

    // If pending count has increased (or first load where count > 0)
    if (totalPending > lastTotalPendingRef.current) {
      triggerAlarmSound();

      // Send a browser push notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🚨 New Pending SMS/Request!', {
          body: `You have ${totalPending} pending requests waiting to be approved or processed.`,
          tag: 'admin-alert',
          requireInteraction: true
        });
      }
    }

    lastTotalPendingRef.current = totalPending;

    // Set 3 minute recurring loop
    const ringInterval = 3 * 60 * 1000; // 3 minutes
    const intervalId = setInterval(() => {
      triggerAlarmSound();
    }, ringInterval);

    return () => clearInterval(intervalId);
  }, [totalPending, triggerAlarmSound]);

  // Request notification permission on load
  React.useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleCreateOfferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerTitle || !offerOriginalPrice || !offerOfferPrice) {
      alert('Please fill in all required fields');
      return;
    }
    onAddOffer({
      operator: offerOperator,
      title: offerTitle,
      description: offerDescription,
      validity: offerValidity,
      originalPrice: Number(offerOriginalPrice),
      offerPrice: Number(offerOfferPrice),
      category: offerCategory
    });
    // Reset form
    setOfferTitle('');
    setOfferDescription('');
    setOfferValidity('30 Days');
    setOfferOriginalPrice('');
    setOfferOfferPrice('');
    alert('Offer added successfully!');
  };

  const handleUpdateConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig(tempConfig);
    alert('Telecom configuration updated successfully!');
  };

  const operatorColors: Record<OperatorName, string> = {
    'GP': 'bg-blue-600 text-white',
    'Robi': 'bg-red-600 text-white',
    'Airtel': 'bg-rose-500 text-white',
    'Banglalink': 'bg-orange-500 text-white',
    'Teletalk': 'bg-emerald-600 text-white'
  };

  return (
    <div className="bg-slate-900 text-slate-100 min-h-screen font-sans pb-16">
      {/* Admin header */}
      <div className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs bg-red-500 text-white font-mono font-bold animate-pulse">ADMIN CONSOLE</span>
            <h1 className="text-xl font-bold tracking-tight text-white">{config.telecomName} Owner Dashboard</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">Manage user funds, approve payments, update offers, and dispatch sim recharge packages.</p>
        </div>
        
        {/* Admin Navigation */}
        <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
          {[
            { id: 'dashboard', label: 'Overview', icon: TrendingUp },
            { id: 'users', label: 'Users/Resellers (রিসেলার তালিকা)', icon: Users },
            { id: 'approvals', label: `Add Money Approvals (${pendingApprovalsCount})`, icon: CreditCard, alert: pendingApprovalsCount > 0 },
            { id: 'orders', label: `Pending Orders (${pendingOrdersCount})`, icon: Smartphone, alert: pendingOrdersCount > 0 },
            { id: 'offers', label: 'Manage Packs', icon: PlusCircle },
            { id: 'settings', label: 'Settings & Branding', icon: Settings },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`admin-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' 
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.alert && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                )}
              </button>
            );
          })}

          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/30 transition-all duration-200 cursor-pointer md:ml-4"
              title="Exit Admin Panel"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Owner Alarm Alert System Banner */}
        <div id="admin-sound-alert-banner" className={`p-4 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-300 ${
          totalPending > 0 
            ? 'bg-red-500/10 border-red-500/30 shadow-lg shadow-red-950/20' 
            : 'bg-slate-800/40 border-slate-700/60'
        }`}>
          <div className="flex items-center gap-3.5 text-center md:text-left flex-col md:flex-row w-full">
            <div className={`p-3 rounded-xl flex items-center justify-center shrink-0 ${
              totalPending > 0 
                ? 'bg-red-500 text-white animate-bounce shadow-md shadow-red-500/20' 
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}>
              {totalPending > 0 ? (
                <BellRing className="w-5 h-5" />
              ) : (
                <Bell className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 justify-center md:justify-start flex-wrap">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Owner Alarm & Sound System</h3>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                  soundEnabled 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-slate-700 text-slate-400'
                }`}>
                  {soundEnabled ? '🔔 AUDIO ENABLED' : '🔇 MUTED'}
                </span>
                {totalPending > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-600 text-white animate-pulse">
                    🚨 RINGING EVERY 3 MIN
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {totalPending > 0 
                  ? `Alert! There are ${totalPending} pending requests (${pendingApprovalsCount} Deposits, ${pendingOrdersCount} SIM Orders) requiring verification.` 
                  : "Standing by... When clients submit payment requests or purchase packs, this page will play a telephone ring tone every 3 minutes until processed."
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-center md:justify-end shrink-0">
            <button
              onClick={() => {
                const newState = !soundEnabled;
                setSoundEnabled(newState);
                if (newState) {
                  // Play a quick sound to confirm and unlock AudioContext
                  setTimeout(() => {
                    try {
                      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                      if (AudioContext) {
                        const ctx = new AudioContext();
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.frequency.setValueAtTime(880, ctx.currentTime);
                        gain.gain.setValueAtTime(0.1, ctx.currentTime);
                        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        osc.start();
                        osc.stop(ctx.currentTime + 0.15);
                      }
                    } catch(e){}
                  }, 50);
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                soundEnabled 
                  ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {soundEnabled ? (
                <>
                  <VolumeX className="w-3.5 h-3.5" /> Mute Alarm
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" /> Enable Alarm
                </>
              )}
            </button>
            
            <button
              onClick={triggerAlarmSound}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              title="Clicking this unlocks Chrome/Safari browser autoplay policy"
            >
              <Volume2 className="w-3.5 h-3.5" /> Test Sound Ring
            </button>
          </div>
        </div>
        
        {/* TAB 1: DASHBOARD OVERVIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div id="stat-total-users" className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Active Users</p>
                  <h3 className="text-3xl font-black text-white mt-1">{users.filter(u => u.role === 'user').length}</h3>
                  <p className="text-xs text-slate-400 mt-1">Registered clients in database</p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              <div id="stat-total-balance" className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Clients Capital Vault</p>
                  <h3 className="text-3xl font-black text-emerald-400 mt-1">{totalBalance.toLocaleString()} <span className="text-lg font-bold">Tk</span></h3>
                  <p className="text-xs text-slate-400 mt-1">Sum of all current user balances</p>
                </div>
                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>

              <div id="stat-pending-approvals" className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Deposits</p>
                  <h3 className={`text-3xl font-black mt-1 ${pendingApprovalsCount > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-300'}`}>
                    {pendingApprovalsCount}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Awaiting verification</p>
                </div>
                <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
                  <CreditCard className="w-6 h-6" />
                </div>
              </div>

              <div id="stat-sales-total" className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed Sales Volume</p>
                  <h3 className="text-3xl font-black text-sky-400 mt-1">{completedSalesTotal.toLocaleString()} <span className="text-lg font-bold">Tk</span></h3>
                  <p className="text-xs text-slate-400 mt-1">Total volume of delivered offers</p>
                </div>
                <div className="p-3 bg-sky-500/10 rounded-xl text-sky-400 border border-sky-500/20">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Split layout: Recent transactions & Quick Users Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Recent pending items */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Pending balance list */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 bg-slate-800 border-b border-slate-700/80 flex justify-between items-center">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-400" />
                      Incoming Manual Add Money Submissions
                    </h2>
                    <button 
                      onClick={() => setActiveTab('approvals')}
                      className="text-xs font-semibold text-blue-400 hover:underline cursor-pointer"
                    >
                      View All
                    </button>
                  </div>
                  
                  {balanceRequests.filter(r => r.status === 'Pending').length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-60" />
                      <p className="text-sm font-semibold">All deposit requests are verified!</p>
                      <p className="text-xs text-slate-500 mt-1">No pending requests in queue.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-700/40 max-h-[350px] overflow-y-auto">
                      {balanceRequests.filter(r => r.status === 'Pending').map(req => (
                        <div key={req.id} className="p-4 hover:bg-slate-750 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-100">{req.userName}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                req.method === 'bKash' ? 'bg-pink-600 text-white' : 
                                req.method === 'Nagad' ? 'bg-orange-600 text-white' : 'bg-blue-600 text-white'
                              }`}>
                                {req.method}
                              </span>
                            </div>
                            <div className="text-xs text-slate-300 flex flex-wrap gap-x-4 gap-y-0.5">
                              <span>Sender: <strong className="font-mono text-white">{req.senderNumber}</strong></span>
                              <span>TxID: <strong className="font-mono text-yellow-400">{req.transactionId}</strong></span>
                            </div>
                            <p className="text-[10px] text-slate-500">Submitted at: {new Date(req.createdAt).toLocaleTimeString()}</p>
                          </div>
                          
                          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                            <span className="text-lg font-black text-emerald-400">{req.amount} Tk</span>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => onApproveBalance(req.id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded flex items-center gap-1 transition cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" /> Approve
                              </button>
                              <button
                                onClick={() => onRejectBalance(req.id)}
                                className="px-2.5 py-1 bg-red-600/80 hover:bg-red-500 text-white text-xs font-bold rounded flex items-center gap-1 transition cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pending orders list */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 bg-slate-800 border-b border-slate-700/80 flex justify-between items-center">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-sky-400" />
                      Pending Recharge & Sim Drive Orders
                    </h2>
                    <button 
                      onClick={() => setActiveTab('orders')}
                      className="text-xs font-semibold text-blue-400 hover:underline cursor-pointer"
                    >
                      View All
                    </button>
                  </div>
                  
                  {orders.filter(o => o.status === 'Pending').length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-60" />
                      <p className="text-sm font-semibold">All operator orders are cleared!</p>
                      <p className="text-xs text-slate-500 mt-1 font-sans">No pending SIM drives in database.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-700/40 max-h-[350px] overflow-y-auto">
                      {orders.filter(o => o.status === 'Pending').map(order => (
                        <div key={order.id} className="p-4 hover:bg-slate-750 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${operatorColors[order.operator]}`}>
                                {order.operator}
                              </span>
                              <span className="text-sm font-bold text-slate-100">{order.offerTitle}</span>
                            </div>
                            <div className="text-xs text-slate-300">
                              Target Number: <strong className="font-mono text-sky-400 text-sm">{order.targetPhone}</strong>
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Ordered by: <span className="font-semibold text-slate-300">{order.userName}</span> | ID: {order.id.slice(-6)}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                            <span className="text-md font-bold text-amber-400">{order.offerPrice} Tk</span>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => onCompleteOrder(order.id)}
                                className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded flex items-center gap-1 transition cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" /> Dispatch/Done
                              </button>
                              <button
                                onClick={() => onCancelOrder(order.id)}
                                className="px-2 py-1 bg-red-600/80 hover:bg-red-500 text-white text-xs font-bold rounded transition cursor-pointer"
                              >
                                Cancel & Refund
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Right Column: User Balance Directory */}
              <div className="space-y-6">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 space-y-4">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-slate-300" />
                    User Directory & Balance Vault
                  </h2>
                  
                  <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                    {users.filter(u => u.role === 'user').map(user => {
                      const isEditing = editingUserId === user.id;
                      return (
                        <div key={user.id} className="p-3 bg-slate-800/80 border border-slate-700/40 rounded-lg space-y-3 hover:border-slate-600 transition">
                          {isEditing ? (
                            <div className="space-y-3 animate-fade-in text-xs">
                              <div className="flex justify-between items-center border-b border-slate-700/60 pb-1.5">
                                <span className="font-bold text-yellow-400">Editing: {user.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{user.phone}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] text-slate-400 mb-0.5 uppercase font-bold">Balance (Tk)</label>
                                  <input
                                    type="number"
                                    value={editBalance}
                                    onChange={(e) => setEditBalance(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono focus:outline-none focus:border-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-slate-400 mb-0.5 uppercase font-bold">Reseller Level</label>
                                  <select
                                    value={editLevel}
                                    onChange={(e) => setEditLevel(e.target.value as any)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white focus:outline-none focus:border-blue-500"
                                  >
                                    <option value="Distributor">Distributor (ডিস্ট্রিবিউটর)</option>
                                    <option value="Dealer">Dealer (ডিলার)</option>
                                    <option value="Retailer">Retailer (রিটেইলার)</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[10px] text-slate-400 mb-0.5 uppercase font-bold">Password</label>
                                  <input
                                    type="text"
                                    value={editPassword}
                                    onChange={(e) => setEditPassword(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono focus:outline-none focus:border-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-slate-400 mb-0.5 uppercase font-bold">PIN Code</label>
                                  <input
                                    type="text"
                                    maxLength={4}
                                    value={editPin}
                                    onChange={(e) => setEditPin(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono focus:outline-none focus:border-blue-500"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-1.5 justify-end pt-1">
                                <button
                                  onClick={() => setEditingUserId(null)}
                                  className="px-2.5 py-1 bg-slate-700 hover:bg-slate-650 text-white rounded text-[10px] font-bold cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleSaveUserEdit(user.id)}
                                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold cursor-pointer"
                                >
                                  Save Change
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-3">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-white">{user.name}</span>
                                  <span className="text-[9px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-mono font-medium">
                                    {user.level}
                                  </span>
                                </div>
                                <p className="text-[11px] font-mono text-slate-400">{user.phone}</p>
                                <div className="flex items-center gap-1.5 text-[9px] text-slate-500">
                                  <span>Pw: <strong className="font-mono text-slate-400">{user.password || '123456'}</strong></span>
                                  <span>•</span>
                                  <span>PIN: <strong className="font-mono text-slate-400">{user.pin || '1234'}</strong></span>
                                </div>
                              </div>
                              <div className="text-right flex flex-col items-end shrink-0">
                                <div>
                                  <span className="text-sm font-black text-emerald-400 block">{user.balance} Tk</span>
                                  <span className="text-[9px] text-slate-400 block">Current Balance</span>
                                </div>
                                <button
                                  onClick={() => handleStartEditUser(user)}
                                  className="px-2 py-0.5 bg-slate-700 hover:bg-blue-600 hover:text-white rounded text-[10px] font-bold text-slate-300 transition cursor-pointer mt-1.5"
                                >
                                  Edit Account
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-4 text-center">
                  <h3 className="text-xs font-extrabold tracking-wider uppercase text-blue-300">Convert to Android App (APK)</h3>
                  <p className="text-xs text-slate-300 mt-2">
                    Once you finish editing, the built files in the `dist` directory can be easily converted into a hybrid Android APK (using Apache Cordova or Capacitor WebViews) which your reseller clients can install directly on their phones!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: USERS LIST (রিসেলার তালিকা) */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Top Cards/Chart */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-5 flex items-center justify-between shadow-lg">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Reseller Users (মোট ইউজার)</p>
                  <h3 className="text-3xl font-black text-white mt-1">
                    {users.filter(u => u.role === 'user').length} <span className="text-sm font-normal text-slate-400">Clients</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-2">Active registered clients using the telecom platform</p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
                  <Users className="w-8 h-8" />
                </div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-5 flex items-center justify-between shadow-lg">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Grand Total Balance (মোট ব্যালেন্স)</p>
                  <h3 className="text-3xl font-black text-emerald-400 mt-1">
                    {totalBalance.toLocaleString()} <span className="text-lg font-bold">Tk</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-2">Sum of all current user capital balances in system</p>
                </div>
                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                  <DollarSign className="w-8 h-8" />
                </div>
              </div>
            </div>

            {/* Users table card */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white">All Reseller Accounts Directory</h2>
                  <p className="text-xs text-slate-400 font-sans">View balances, edit permissions, change PINs, passwords and update credits instantly.</p>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search client by name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg pl-9 pr-4 py-2 w-full sm:w-64 focus:outline-none focus:border-blue-500"
                  />
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                </div>
              </div>

              {/* Responsive layout for users list */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse hidden md:table">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400 font-semibold uppercase tracking-wider bg-slate-850">
                      <th className="py-3 px-4">User Name</th>
                      <th className="py-3 px-4">Mobile Number</th>
                      <th className="py-3 px-4">Level</th>
                      <th className="py-3 px-4">Balance (Tk)</th>
                      <th className="py-3 px-4">Password / PIN</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/40">
                    {users
                      .filter(u => u.role === 'user')
                      .filter(u => {
                        if (!searchQuery) return true;
                        const q = searchQuery.toLowerCase();
                        return u.name.toLowerCase().includes(q) || u.phone.toLowerCase().includes(q);
                      })
                      .map(user => {
                        const isEditing = editingUserId === user.id;
                        return (
                          <tr key={user.id} className="hover:bg-slate-750 transition duration-150">
                            {isEditing ? (
                              <td colSpan={6} className="py-4 px-4 bg-slate-800/40">
                                <div className="space-y-3 max-w-4xl animate-fade-in text-xs">
                                  <div className="flex justify-between items-center border-b border-slate-700/60 pb-1.5 mb-2">
                                    <span className="font-bold text-yellow-400">Editing Account: {user.name} ({user.phone})</span>
                                  </div>
                                  <div className="grid grid-cols-4 gap-4">
                                    <div>
                                      <label className="block text-[10px] text-slate-400 mb-1 uppercase font-bold">Balance (Tk)</label>
                                      <input
                                        type="number"
                                        value={editBalance}
                                        onChange={(e) => setEditBalance(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-750 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-blue-500"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] text-slate-400 mb-1 uppercase font-bold">Reseller Level</label>
                                      <select
                                        value={editLevel}
                                        onChange={(e) => setEditLevel(e.target.value as any)}
                                        className="w-full bg-slate-900 border border-slate-750 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                                      >
                                        <option value="Distributor">Distributor (ডিস্ট্রিবিউটর)</option>
                                        <option value="Dealer">Dealer (ডিলার)</option>
                                        <option value="Retailer">Retailer (রিটেইলার)</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-[10px] text-slate-400 mb-1 uppercase font-bold">Password</label>
                                      <input
                                        type="text"
                                        value={editPassword}
                                        onChange={(e) => setEditPassword(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-750 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-blue-500"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] text-slate-400 mb-1 uppercase font-bold">PIN Code</label>
                                      <input
                                        type="text"
                                        maxLength={4}
                                        value={editPin}
                                        onChange={(e) => setEditPin(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-750 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-blue-500"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex gap-2 justify-end pt-2">
                                    <button
                                      onClick={() => setEditingUserId(null)}
                                      className="px-4 py-2 bg-slate-750 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => handleSaveUserEdit(user.id)}
                                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                                    >
                                      Save Account Changes
                                    </button>
                                  </div>
                                </div>
                              </td>
                            ) : (
                              <>
                                <td className="py-3 px-4 font-bold text-white">{user.name}</td>
                                <td className="py-3 px-4 font-mono text-slate-300">{user.phone}</td>
                                <td className="py-3 px-4">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-slate-300">
                                    {user.level}
                                  </span>
                                </td>
                                <td className="py-3 px-4 font-black text-emerald-400 text-sm">{user.balance} Tk</td>
                                <td className="py-3 px-4 text-slate-400 space-x-3">
                                  <span>Pw: <strong className="font-mono text-slate-200">{user.password || '123456'}</strong></span>
                                  <span>PIN: <strong className="font-mono text-slate-200">{user.pin || '1234'}</strong></span>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <button
                                    onClick={() => handleStartEditUser(user)}
                                    className="px-2.5 py-1 bg-slate-700 hover:bg-blue-600 hover:text-white rounded text-[11px] font-bold text-slate-200 transition cursor-pointer"
                                  >
                                    Edit Account
                                  </button>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                  </tbody>
                </table>

                {/* Mobile Grid View */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                  {users
                    .filter(u => u.role === 'user')
                    .filter(u => {
                      if (!searchQuery) return true;
                      const q = searchQuery.toLowerCase();
                      return u.name.toLowerCase().includes(q) || u.phone.toLowerCase().includes(q);
                    })
                    .map(user => {
                      const isEditing = editingUserId === user.id;
                      return (
                        <div key={user.id} className="p-4 bg-slate-850 border border-slate-750 rounded-xl space-y-3">
                          {isEditing ? (
                            <div className="space-y-3 text-xs">
                              <div className="border-b border-slate-700 pb-1.5">
                                <span className="font-bold text-yellow-400">Editing: {user.name}</span>
                              </div>
                              <div className="space-y-2.5">
                                <div>
                                  <label className="block text-[10px] text-slate-400 mb-0.5 uppercase font-bold">Balance (Tk)</label>
                                  <input
                                    type="number"
                                    value={editBalance}
                                    onChange={(e) => setEditBalance(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-slate-400 mb-0.5 uppercase font-bold">Level</label>
                                  <select
                                    value={editLevel}
                                    onChange={(e) => setEditLevel(e.target.value as any)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:outline-none"
                                  >
                                    <option value="Distributor">Distributor</option>
                                    <option value="Dealer">Dealer</option>
                                    <option value="Retailer">Retailer</option>
                                  </select>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[10px] text-slate-400 mb-0.5 uppercase font-bold">Password</label>
                                    <input
                                      type="text"
                                      value={editPassword}
                                      onChange={(e) => setEditPassword(e.target.value)}
                                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono focus:outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-slate-400 mb-0.5 uppercase font-bold">PIN</label>
                                    <input
                                      type="text"
                                      maxLength={4}
                                      value={editPin}
                                      onChange={(e) => setEditPin(e.target.value)}
                                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono focus:outline-none"
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2 justify-end pt-1">
                                <button
                                  onClick={() => setEditingUserId(null)}
                                  className="px-3 py-1.5 bg-slate-750 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleSaveUserEdit(user.id)}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-bold text-white text-sm">{user.name}</h4>
                                  <p className="text-xs text-slate-400 font-mono mt-0.5">{user.phone}</p>
                                </div>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-slate-300">
                                  {user.level}
                                </span>
                              </div>
                              
                              <div className="flex justify-between items-center border-t border-slate-800 pt-2 text-xs">
                                <div className="space-y-0.5">
                                  <p className="text-slate-400">Password: <span className="font-mono text-white">{user.password || '123456'}</span></p>
                                  <p className="text-slate-400">PIN: <span className="font-mono text-white">{user.pin || '1234'}</span></p>
                                </div>
                                <div className="text-right">
                                  <span className="text-sm font-black text-emerald-400 block">{user.balance} Tk</span>
                                  <button
                                    onClick={() => handleStartEditUser(user)}
                                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold mt-1.5 transition cursor-pointer"
                                  >
                                    Edit Account
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ADD MONEY APPROVALS MANAGER */}
        {activeTab === 'approvals' && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">Manual Add Money Deposit Requests</h2>
                <p className="text-xs text-slate-400">Clients submit money to your bKash, Nagad, or Rocket, then request balance additions. Match dynamic Transaction IDs and click Approve.</p>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search user, TxID, sender..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg pl-9 pr-4 py-2 w-full sm:w-64 focus:outline-none focus:border-blue-500"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 font-semibold uppercase tracking-wider bg-slate-850">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Payment Agent</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Sender Number</th>
                    <th className="py-3 px-4">Transaction ID</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {balanceRequests
                    .filter(r => {
                      if (!searchQuery) return true;
                      const q = searchQuery.toLowerCase();
                      return r.userName.toLowerCase().includes(q) || 
                             r.transactionId.toLowerCase().includes(q) || 
                             r.senderNumber.includes(q) ||
                             r.method.toLowerCase().includes(q);
                    })
                    .map(req => (
                      <tr key={req.id} className="hover:bg-slate-750 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white">{req.userName}</div>
                          <div className="text-[10px] text-slate-400">UID: {req.userId.slice(-6)}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${
                            req.method === 'bKash' ? 'bg-pink-600 text-white' : 
                            req.method === 'Nagad' ? 'bg-orange-600 text-white' : 'bg-blue-600 text-white'
                          }`}>
                            {req.method}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-extrabold text-sm text-emerald-400">{req.amount} Tk</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-slate-300">{req.senderNumber}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-yellow-400 font-bold tracking-wider">{req.transactionId}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {new Date(req.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            req.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            req.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                          }`}>
                            {req.status === 'Approved' && <CheckCircle className="w-3 h-3" />}
                            {req.status === 'Rejected' && <XCircle className="w-3 h-3" />}
                            {req.status === 'Pending' && <Clock className="w-3 h-3" />}
                            {req.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {req.status === 'Pending' ? (
                            <div className="flex gap-1.5 justify-end">
                              <button
                                onClick={() => onApproveBalance(req.id)}
                                className="p-1 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded text-[11px] flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3 h-3" /> Approve
                              </button>
                              <button
                                onClick={() => onRejectBalance(req.id)}
                                className="p-1 px-2.5 bg-red-600/80 hover:bg-red-500 text-white font-semibold rounded text-[11px] flex items-center gap-1 cursor-pointer"
                              >
                                <XCircle className="w-3 h-3" /> Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-500 italic text-[11px]">Processed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PENDING SIM DRIVE ORDERS */}
        {activeTab === 'orders' && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">SIM Offer Recharge Dispatch Center</h2>
                <p className="text-xs text-slate-400">Reseller clients buy packs from their app. When you load the pack on their number manually from your actual dealer SIM, click done!</p>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search target phone, offer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg pl-9 pr-4 py-2 w-full sm:w-64 focus:outline-none focus:border-blue-500"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 font-semibold uppercase tracking-wider bg-slate-850">
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Operator</th>
                    <th className="py-3 px-4">Offer / Pack Title</th>
                    <th className="py-3 px-4 text-sky-400 font-bold">Target Mobile Number</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Ordered By</th>
                    <th className="py-3 px-4">Order Time</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {orders
                    .filter(o => {
                      if (!searchQuery) return true;
                      const q = searchQuery.toLowerCase();
                      return o.targetPhone.includes(q) || 
                             o.offerTitle.toLowerCase().includes(q) || 
                             o.userName.toLowerCase().includes(q) ||
                             o.id.toLowerCase().includes(q);
                    })
                    .map(order => (
                      <tr key={order.id} className="hover:bg-slate-750 transition">
                        <td className="py-3.5 px-4 font-mono text-[10px] text-slate-400">
                          #{order.id.slice(-6)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${operatorColors[order.operator]}`}>
                            {order.operator}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white">{order.offerTitle}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-sm text-sky-400 font-extrabold tracking-wider">{order.targetPhone}</span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-amber-400">
                          {order.offerPrice} Tk
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-200">{order.userName}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {new Date(order.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            order.status === 'Successful' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            order.status === 'Canceled' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                          }`}>
                            {order.status === 'Successful' && <CheckCircle className="w-3 h-3" />}
                            {order.status === 'Canceled' && <XCircle className="w-3 h-3" />}
                            {order.status === 'Pending' && <Clock className="w-3 h-3" />}
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {order.status === 'Pending' ? (
                            <div className="flex gap-1 justify-end">
                              <button
                                onClick={() => onCompleteOrder(order.id)}
                                className="px-2 py-1 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded flex items-center gap-1 transition cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" /> Done
                              </button>
                              <button
                                onClick={() => onCancelOrder(order.id)}
                                className="px-2 py-1 bg-red-655 text-white bg-red-650 hover:bg-red-500 text-xs font-bold rounded transition cursor-pointer"
                              >
                                Cancel & Refund
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-500 italic">Dispatched</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: MANAGE SIM OFFERS / DRIVE PACKS */}
        {activeTab === 'offers' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Offer creator form */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 space-y-4 h-fit">
              <div className="border-b border-slate-700 pb-3">
                <h2 className="text-md font-bold text-white flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-blue-500" />
                  Add New Sim Offer
                </h2>
                <p className="text-xs text-slate-400 mt-1">Publish drive packs or regular recharges.</p>
              </div>

              <form onSubmit={handleCreateOfferSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Select Telecom Operator *</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {(['GP', 'Robi', 'Airtel', 'Banglalink', 'Teletalk'] as OperatorName[]).map(op => (
                      <button
                        key={op}
                        type="button"
                        onClick={() => setOfferOperator(op)}
                        className={`py-2 text-xs font-bold rounded-lg cursor-pointer transition ${
                          offerOperator === op 
                            ? 'bg-blue-600 border border-blue-400 text-white' 
                            : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-750'
                        }`}
                      >
                        {op}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Pack Title / Value *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10GB Data - 30 Day"
                    value={offerTitle}
                    onChange={(e) => setOfferTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Detailed Description</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. 500 Min any network, bonus 2GB with high speed 4G connectivity..."
                    value={offerDescription}
                    onChange={(e) => setOfferDescription(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Validity (Days) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 30 Days"
                      value={offerValidity}
                      onChange={(e) => setOfferValidity(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Pack Type *</label>
                    <select
                      value={offerCategory}
                      onChange={(e) => setOfferCategory(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="Drive Pack">Drive Pack</option>
                      <option value="Regular Pack">Regular Pack</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Original Price (Tk) *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 500"
                      value={offerOriginalPrice}
                      onChange={(e) => setOfferOriginalPrice(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Discount Price (Tk) *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 450"
                      value={offerOfferPrice}
                      onChange={(e) => setOfferOfferPrice(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition shadow-lg shadow-blue-900/20 cursor-pointer"
                >
                  Publish Offer to Catalog
                </button>
              </form>
            </div>

            {/* Offer catalog editor */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-700 pb-3">
                <div>
                  <h2 className="text-md font-bold text-white">Published Packages & Drive Catalog</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Below is the live catalog visible to your clients. Delete or toggle dynamic active states.</p>
                </div>
                <span className="bg-slate-900 px-3 py-1 rounded-full text-xs text-slate-300 border border-slate-800 font-mono">
                  {offers.length} Offers
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[550px] overflow-y-auto pr-1">
                {offers.map(offer => (
                  <div 
                    key={offer.id} 
                    className={`p-3.5 bg-slate-850 border rounded-xl flex flex-col justify-between gap-3 hover:border-slate-600 transition ${
                      offer.isActive ? 'border-slate-750' : 'border-slate-800 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${operatorColors[offer.operator]}`}>
                            {offer.operator}
                          </span>
                          <span className="text-[9px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-bold font-sans">
                            {offer.category}
                          </span>
                        </div>
                        <button
                          onClick={() => onDeleteOffer(offer.id)}
                          className="text-slate-400 hover:text-red-400 p-1 rounded transition cursor-pointer"
                          title="Delete Pack"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h3 className="text-sm font-extrabold text-slate-100 mt-2">{offer.title}</h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{offer.description || 'No description provided.'}</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-800/85 pt-2.5">
                      <div className="text-xs text-slate-400">
                        Validity: <span className="font-semibold text-slate-200">{offer.validity}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 line-through mr-1.5">{offer.originalPrice} Tk</span>
                        <span className="text-sm font-black text-emerald-400">{offer.offerPrice} Tk</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-slate-400">
                        Status: <span className={offer.isActive ? "text-emerald-400 font-bold" : "text-slate-400"}>{offer.isActive ? "Live" : "Disabled"}</span>
                      </span>
                      <button
                        onClick={() => onToggleOfferStatus(offer.id)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                          offer.isActive 
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/25' 
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25'
                        }`}
                      >
                        {offer.isActive ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: BRANDING & APP CONFIGURATION */}
        {activeTab === 'settings' && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 max-w-2xl mx-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-500 animate-spin-slow" />
                Branding & Telecom Customizer
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Dynamically customize the app's brand title, admin billing lines, manual helper texts, and social link triggers.</p>
            </div>

            <form onSubmit={handleUpdateConfigSubmit} className="space-y-5">
              <div className="space-y-4 divide-y divide-slate-750">
                
                {/* Brand Name */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-200 uppercase mb-1.5">Telecom Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={tempConfig.telecomName}
                    onChange={(e) => setTempConfig({ ...tempConfig, telecomName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-bold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Changes the title bar logo and main display name instantly on both web and android apps.</p>
                </div>

                {/* Billing Numbers */}
                <div className="pt-4 space-y-3">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Manual Add Money Agent Phone Lines</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">bKash Number</label>
                      <input
                        type="text"
                        value={tempConfig.bkashNumber}
                        onChange={(e) => setTempConfig({ ...tempConfig, bkashNumber: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Nagad Number</label>
                      <input
                        type="text"
                        value={tempConfig.nagadNumber}
                        onChange={(e) => setTempConfig({ ...tempConfig, nagadNumber: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Rocket Number</label>
                      <input
                        type="text"
                        value={tempConfig.rocketNumber}
                        onChange={(e) => setTempConfig({ ...tempConfig, rocketNumber: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Dynamic Banner Marquee */}
                <div className="pt-4">
                  <label className="block text-xs font-bold text-slate-200 uppercase mb-1.5">Notice Board Notification (Marquee)</label>
                  <textarea
                    rows={3}
                    value={tempConfig.noticeText}
                    onChange={(e) => setTempConfig({ ...tempConfig, noticeText: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">This text runs on the top marquee board of the client home screens. Useful for alerts, deals, or dynamic greetings.</p>
                </div>

                {/* Support and Chat Links */}
                <div className="pt-4 space-y-3">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Social Chat Channels (Admin Support)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Telegram Support Link</label>
                      <input
                        type="text"
                        value={tempConfig.supportTelegram}
                        onChange={(e) => setTempConfig({ ...tempConfig, supportTelegram: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">WhatsApp Chat Trigger</label>
                      <input
                        type="text"
                        value={tempConfig.supportWhatsapp}
                        onChange={(e) => setTempConfig({ ...tempConfig, supportWhatsapp: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Facebook Fan Page</label>
                      <input
                        type="text"
                        value={tempConfig.supportFacebook}
                        onChange={(e) => setTempConfig({ ...tempConfig, supportFacebook: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">YouTube Channel URL</label>
                      <input
                        type="text"
                        value={tempConfig.supportYoutube}
                        onChange={(e) => setTempConfig({ ...tempConfig, supportYoutube: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>

              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition shadow-lg shadow-blue-900/20 cursor-pointer"
                >
                  Save Global Branding Config
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
