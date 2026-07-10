import { supabase } from './supabase';
import { User, Offer, BalanceRequest, OfferOrder, AppConfig, OperatorName } from '../types';

// Helper to convert database app_settings to AppConfig
function mapAppSettings(row: any): AppConfig {
  if (!row) return {
    telecomName: 'Bayzid Telecom',
    bkashNumber: '01601202721',
    nagadNumber: '01601202721',
    rocketNumber: '01601202721',
    supportTelegram: 'https://t.me/bayzidtelecom_bd',
    supportWhatsapp: 'https://wa.me/8801601202721',
    supportFacebook: 'https://facebook.com/bayzidtelecom',
    supportYoutube: 'https://youtube.com/c/bayzidtelecom',
    noticeText: 'বিসমিল্লাহির রহমানির রহিম। আল্লাহ ভরসা। বায়জিদ টেলিকম-এ আপনাকে স্বাগতম! আমাদের সকল ড্রাইভ প্যাক চালু আছে।'
  };
  return {
    telecomName: row.telecom_name || 'Bayzid Telecom',
    bkashNumber: row.bkash_no || '01601202721',
    nagadNumber: row.nagad_no || '01601202721',
    rocketNumber: row.rocket_no || '01601202721',
    supportTelegram: row.telegram_link || 'https://t.me/bayzidtelecom_bd',
    supportWhatsapp: row.whatsapp_link || 'https://wa.me/8801601202721',
    supportFacebook: row.facebook_link || 'https://facebook.com/bayzidtelecom',
    supportYoutube: row.youtube_link || 'https://youtube.com/c/bayzidtelecom',
    noticeText: row.running_notice || 'বিসমিল্লাহির রহমানির রহিম। আল্লাহ ভরসা। বায়জিদ টেলিকম-এ আপনাকে স্বাগতম!'
  };
}

// 1. App Settings
export async function fetchAppSettings(): Promise<AppConfig | null> {
  try {
    const { data, error } = await supabase.from('app_settings').select('*').eq('id', 1).single();
    if (error) {
      console.warn('Supabase fetchAppSettings failed.', error);
      return null;
    }
    return mapAppSettings(data);
  } catch (err) {
    console.warn('Error fetching app settings.', err);
    return null;
  }
}

export async function updateAppSettings(settings: AppConfig): Promise<boolean> {
  try {
    const { error } = await supabase.from('app_settings').upsert({
      id: 1,
      telecom_name: settings.telecomName,
      running_notice: settings.noticeText,
      bkash_no: settings.bkashNumber,
      nagad_no: settings.nagadNumber,
      rocket_no: settings.rocketNumber,
      whatsapp_link: settings.supportWhatsapp,
      telegram_link: settings.supportTelegram,
      facebook_link: settings.supportFacebook,
      youtube_link: settings.supportYoutube,
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Error updating app settings in Supabase:', err);
    return false;
  }
}

// 2. Drive Offers
export async function fetchDriveOffers(): Promise<Offer[] | null> {
  try {
    const { data, error } = await supabase
      .from('drive_offers')
      .select('*')
      .order('operator', { ascending: true });
    
    if (error) throw error;
    
    return (data || []).map(row => ({
      id: row.id,
      operator: row.operator as OperatorName,
      title: row.title,
      description: row.title, // Map same for standard UI
      validity: row.validity,
      originalPrice: Number(row.regular_price) || 0,
      offerPrice: Number(row.offer_price) || 0,
      category: 'Drive Pack',
      isActive: row.is_live
    }));
  } catch (err) {
    console.warn('Error fetching drive offers:', err);
    return null;
  }
}

export async function createDriveOffer(offer: Omit<Offer, 'id'>): Promise<Offer | null> {
  try {
    const { data, error } = await supabase.from('drive_offers').insert({
      operator: offer.operator,
      title: offer.title,
      offer_price: offer.offerPrice,
      regular_price: offer.originalPrice,
      validity: offer.validity,
      is_live: offer.isActive
    }).select().single();

    if (error) throw error;

    return {
      id: data.id,
      operator: data.operator as OperatorName,
      title: data.title,
      description: data.title,
      validity: data.validity,
      originalPrice: Number(data.regular_price),
      offerPrice: Number(data.offer_price),
      category: 'Drive Pack',
      isActive: data.is_live
    };
  } catch (err) {
    console.warn('Error creating drive offer:', err);
    return null;
  }
}

export async function updateDriveOffer(id: string, fields: Partial<Offer>): Promise<boolean> {
  try {
    const payload: any = {};
    if (fields.operator) payload.operator = fields.operator;
    if (fields.title) payload.title = fields.title;
    if (fields.offerPrice !== undefined) payload.offer_price = fields.offerPrice;
    if (fields.originalPrice !== undefined) payload.regular_price = fields.originalPrice;
    if (fields.validity) payload.validity = fields.validity;
    if (fields.isActive !== undefined) payload.is_live = fields.isActive;

    const { error } = await supabase.from('drive_offers').update(payload).eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Error updating drive offer:', err);
    return false;
  }
}

export async function deleteDriveOffer(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('drive_offers').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Error deleting drive offer:', err);
    return false;
  }
}

// 3. Resellers Profiles (Users)
export async function fetchUsersProfiles(): Promise<User[] | null> {
  try {
    const { data, error } = await supabase.from('users_profile').select('*');
    if (error) throw error;

    return (data || []).map(row => {
      const emailLocalPart = row.email.split('@')[0];
      
      // Parse name from password field if it contains " - "
      let name = emailLocalPart;
      let password = row.password || 'Bayzid@#2023';
      
      if (row.password && row.password.includes(' - ')) {
        const parts = row.password.split(' - ');
        name = parts[0];
        password = parts.slice(1).join(' - ');
      }

      return {
        id: row.id,
        name: name,
        phone: emailLocalPart,
        balance: Number(row.balance) || 0,
        role: row.role as 'user' | 'admin',
        level: row.level as 'Distributor' | 'Dealer' | 'Retailer',
        verified: row.status === 'Active',
        deviceDetails: 'Registered Device',
        password: password,
        pin: row.pin || '1234',
        deviceLocked: false,
        twoStepEnabled: true,
      };
    });
  } catch (err) {
    console.warn('Error fetching reseller profiles:', err);
    return null;
  }
}

export async function updateUserProfile(userId: string, fields: Partial<User>): Promise<boolean> {
  try {
    const payload: any = {};
    if (fields.balance !== undefined) payload.balance = fields.balance;
    if (fields.level) payload.level = fields.level;
    if (fields.password) {
      // If updating password, make sure to preserve Name if possible
      const { data: existing } = await supabase.from('users_profile').select('password').eq('id', userId).single();
      if (existing && existing.password && existing.password.includes(' - ')) {
        const name = existing.password.split(' - ')[0];
        payload.password = `${name} - ${fields.password}`;
      } else {
        payload.password = fields.password;
      }
    }
    if (fields.pin) payload.pin = fields.pin;
    if (fields.verified !== undefined) payload.status = fields.verified ? 'Active' : 'Suspended';

    const { error } = await supabase.from('users_profile').update(payload).eq('id', userId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Error updating user profile:', err);
    return false;
  }
}

export async function createUserProfile(user: User): Promise<boolean> {
  try {
    const { error } = await supabase.from('users_profile').insert({
      id: user.id,
      email: user.phone.includes('@') ? user.phone : `${user.phone.replace(/[^0-9]/g, '')}@bayzidtelecom.com`,
      balance: user.balance || 0,
      role: user.role || 'user',
      level: user.level || 'Retailer',
      status: 'Active',
      password: `${user.name} - ${user.password || '123456'}`,
      pin: user.pin || '1234',
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Error creating user profile in Supabase:', err);
    return false;
  }
}

// 4. Deposits
export async function fetchDeposits(): Promise<BalanceRequest[] | null> {
  try {
    const { data, error } = await supabase
      .from('deposits')
      .select('*, users_profile(email)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      userName: row.users_profile ? row.users_profile.email.split('@')[0] : 'Reseller',
      amount: Number(row.amount) || 0,
      senderNumber: row.sender_number,
      transactionId: row.transaction_id,
      method: row.payment_method as 'bKash' | 'Nagad' | 'Rocket',
      status: row.status as 'Pending' | 'Approved' | 'Rejected',
      createdAt: row.created_at
    }));
  } catch (err) {
    console.warn('Error fetching deposits:', err);
    return null;
  }
}

export async function createDepositRequest(
  userId: string,
  method: 'bKash' | 'Nagad' | 'Rocket',
  amount: number,
  senderNumber: string,
  transactionId: string
): Promise<boolean> {
  try {
    const { error } = await supabase.from('deposits').insert({
      user_id: userId,
      payment_method: method,
      amount: amount,
      sender_number: senderNumber,
      transaction_id: transactionId,
      status: 'Pending'
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Error submitting deposit request:', err);
    throw err;
  }
}

export async function approveDepositRequest(depositId: string, amount: number): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('approve_deposit', {
      p_deposit_id: depositId,
      p_amount: amount
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Error executing deposit approval RPC:', err);
    return false;
  }
}

export async function rejectDepositRequest(depositId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('deposits')
      .update({ status: 'Rejected' })
      .eq('id', depositId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Error rejecting deposit request:', err);
    return false;
  }
}

// 5. Orders
export async function fetchOrders(): Promise<OfferOrder[] | null> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, users_profile(email), drive_offers(title, operator)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      userName: row.users_profile ? row.users_profile.email.split('@')[0] : 'Reseller',
      offerId: row.offer_id,
      offerTitle: row.drive_offers ? row.drive_offers.title : 'Telecom Package',
      operator: (row.drive_offers ? row.drive_offers.operator : 'GP') as OperatorName,
      offerPrice: Number(row.amount_paid) || 0,
      targetPhone: row.target_number,
      status: row.status === 'Successful' ? 'Successful' : row.status === 'Refunded' ? 'Canceled' : 'Pending',
      createdAt: row.created_at
    }));
  } catch (err) {
    console.warn('Error fetching orders:', err);
    return null;
  }
}

export async function purchaseOfferRPC(
  userId: string,
  offerId: string,
  targetNumber: string,
  price: number
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('purchase_offer', {
      p_user_id: userId,
      p_offer_id: offerId,
      p_target_number: targetNumber,
      p_price: price
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, orderId: data };
  } catch (err: any) {
    console.warn('Error purchasing offer RPC:', err);
    return { success: false, error: err.message || 'Unknown database error' };
  }
}

export async function completeOrder(orderId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'Successful' })
      .eq('id', orderId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Error completing order:', err);
    return false;
  }
}

export async function cancelAndRefundOrderRPC(orderId: string, refundAmount: number): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('refund_order', {
      p_order_id: orderId,
      p_refund_amount: refundAmount
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Error executing order refund RPC:', err);
    return false;
  }
}

// 5. Database Reset & Maintenance Operations (Admin Settings Panel)
export async function deleteAllOrders(): Promise<boolean> {
  try {
    const { error } = await supabase.from('orders').delete().neq('id', 'placeholder-uuid-non-existent');
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Error deleting all orders:', err);
    return false;
  }
}

export async function deleteAllDeposits(): Promise<boolean> {
  try {
    const { error } = await supabase.from('deposits').delete().neq('id', 'placeholder-uuid-non-existent');
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Error deleting all deposits:', err);
    return false;
  }
}

export async function deleteAllUsersExceptAdmin(): Promise<boolean> {
  try {
    // We cannot delete from auth.users directly via client client, 
    // but we can delete from users_profile where role != 'admin'
    const { error } = await supabase.from('users_profile').delete().neq('role', 'admin');
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Error deleting all users except admin:', err);
    return false;
  }
}

export async function adminCreateUser(
  name: string,
  phone: string,
  level: string,
  password?: string,
  pin?: string
): Promise<User | null> {
  try {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const email = `${cleanPhone}@bayzidtelecom.com`;
    const userPass = password || '123456';
    const userPin = pin || '1234';

    // 1. Sign up the new user (this might switch the active session temporarily)
    const { data, error } = await supabase.auth.signUp({
      email,
      password: userPass,
    });

    if (error) throw error;

    if (data.user) {
      // 2. Sign the admin back in immediately to restore admin session!
      await supabase.auth.signInWithPassword({
        email: 'bayzidtelecom1@gmail.com',
        password: 'Bayzid@#2023',
      });

      // 3. Update the new user's profile with correct details (Admin has bypass permissions)
      const { error: updateErr } = await supabase
        .from('users_profile')
        .update({
          level: level,
          pin: userPin,
          password: `${name} - ${userPass}`,
        })
        .eq('id', data.user.id);

      if (updateErr) {
        console.warn('Error updating profile with name/level:', updateErr);
      }

      return {
        id: data.user.id,
        name: name,
        phone: cleanPhone,
        balance: 0,
        role: 'user',
        level: level as 'Distributor' | 'Dealer' | 'Retailer',
        verified: true,
        deviceDetails: 'Registered by Admin',
        password: userPass,
        pin: userPin,
        deviceLocked: false,
        twoStepEnabled: false,
        apiKey: `dt_live_${Math.random().toString(36).substring(2, 16)}`,
        language: 'English'
      };
    }
    return null;
  } catch (err) {
    console.warn('Error in adminCreateUser:', err);
    return null;
  }
}
