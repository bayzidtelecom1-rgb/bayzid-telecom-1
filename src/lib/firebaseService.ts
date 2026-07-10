import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  runTransaction 
} from 'firebase/firestore';
import { User, Offer, BalanceRequest, OfferOrder, AppConfig, OperatorName } from '../types';

// Helper to map AppConfig
function mapAppSettings(data: any): AppConfig {
  if (!data) return {
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
    telecomName: data.telecomName || 'Bayzid Telecom',
    bkashNumber: data.bkashNumber || '01601202721',
    nagadNumber: data.nagadNumber || '01601202721',
    rocketNumber: data.rocketNumber || '01601202721',
    supportTelegram: data.supportTelegram || 'https://t.me/bayzidtelecom_bd',
    supportWhatsapp: data.supportWhatsapp || 'https://wa.me/8801601202721',
    supportFacebook: data.supportFacebook || 'https://facebook.com/bayzidtelecom',
    supportYoutube: data.supportYoutube || 'https://youtube.com/c/bayzidtelecom',
    noticeText: data.noticeText || 'বিসমিল্লাহির রহমানির রহিম। আল্লাহ ভরসা। বায়জিদ টেলিকম-এ আপনাকে স্বাগতম!'
  };
}

// 1. App Settings
export async function fetchAppSettings(): Promise<AppConfig | null> {
  try {
    const docRef = doc(db, 'settings', 'app_config');
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      const defaultSettings = mapAppSettings(null);
      await setDoc(docRef, defaultSettings);
      return defaultSettings;
    }
    return mapAppSettings(docSnap.data());
  } catch (err) {
    console.warn('Error fetching app settings from Firebase:', err);
    return mapAppSettings(null);
  }
}

export async function updateAppSettings(settings: AppConfig): Promise<boolean> {
  try {
    const docRef = doc(db, 'settings', 'app_config');
    await setDoc(docRef, settings, { merge: true });
    return true;
  } catch (err) {
    console.warn('Error updating app settings in Firebase:', err);
    return false;
  }
}

// 2. Drive Offers
export async function fetchDriveOffers(): Promise<Offer[] | null> {
  try {
    const q = query(collection(db, 'offers'), orderBy('operator', 'asc'));
    const querySnapshot = await getDocs(q);
    const offers: Offer[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      offers.push({
        id: doc.id,
        operator: data.operator as OperatorName,
        title: data.title,
        description: data.title,
        validity: data.validity || '30 Days',
        originalPrice: Number(data.originalPrice) || 0,
        offerPrice: Number(data.offerPrice) || 0,
        category: 'Drive Pack',
        isActive: data.isActive !== false
      });
    });

    if (offers.length === 0) {
      // Seed default offers
      const defaultOffers: Omit<Offer, 'id'>[] = [
        {
          operator: 'GP',
          title: 'GP 40GB + 800 Minute (30 Days) - Direct Pack',
          description: 'GP 40GB + 800 Minute (30 Days) - Direct Pack',
          offerPrice: 499,
          originalPrice: 799,
          validity: '30 Days',
          category: 'Drive Pack',
          isActive: true
        },
        {
          operator: 'Robi',
          title: 'Robi 50GB Internet (30 Days) - Full BD',
          description: 'Robi 50GB Internet (30 Days) - Full BD',
          offerPrice: 360,
          originalPrice: 549,
          validity: '30 Days',
          category: 'Drive Pack',
          isActive: true
        },
        {
          operator: 'Airtel',
          title: 'Airtel 35GB + 700 Min Family Pack',
          description: 'Airtel 35GB + 700 Min Family Pack',
          offerPrice: 315,
          originalPrice: 499,
          validity: '30 Days',
          category: 'Drive Pack',
          isActive: true
        },
        {
          operator: 'Banglalink',
          title: 'BL 25GB + 500 Min Unlimited Validity',
          description: 'BL 25GB + 500 Min Unlimited Validity',
          offerPrice: 285,
          originalPrice: 399,
          validity: '30 Days',
          category: 'Drive Pack',
          isActive: true
        }
      ];

      for (const off of defaultOffers) {
        await createDriveOffer(off);
      }
      return fetchDriveOffers();
    }

    return offers;
  } catch (err) {
    console.warn('Error fetching drive offers:', err);
    return [];
  }
}

export async function createDriveOffer(offer: Omit<Offer, 'id'>): Promise<Offer | null> {
  try {
    const docRef = await addDoc(collection(db, 'offers'), {
      operator: offer.operator,
      title: offer.title,
      offerPrice: offer.offerPrice,
      originalPrice: offer.originalPrice,
      validity: offer.validity,
      isActive: offer.isActive,
      createdAt: new Date().toISOString()
    });
    return {
      id: docRef.id,
      ...offer
    };
  } catch (err) {
    console.warn('Error creating drive offer in Firebase:', err);
    return null;
  }
}

export async function updateDriveOffer(id: string, fields: Partial<Offer>): Promise<boolean> {
  try {
    const docRef = doc(db, 'offers', id);
    const cleanFields: any = {};
    if (fields.operator) cleanFields.operator = fields.operator;
    if (fields.title) cleanFields.title = fields.title;
    if (fields.offerPrice !== undefined) cleanFields.offerPrice = fields.offerPrice;
    if (fields.originalPrice !== undefined) cleanFields.originalPrice = fields.originalPrice;
    if (fields.validity) cleanFields.validity = fields.validity;
    if (fields.isActive !== undefined) cleanFields.isActive = fields.isActive;

    await setDoc(docRef, cleanFields, { merge: true });
    return true;
  } catch (err) {
    console.warn('Error updating drive offer:', err);
    return false;
  }
}

export async function deleteDriveOffer(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'offers', id));
    return true;
  } catch (err) {
    console.warn('Error deleting drive offer:', err);
    return false;
  }
}

// 3. Resellers Profiles (Users)
export async function fetchUsersProfiles(): Promise<User[] | null> {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    const users: User[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        id: doc.id,
        name: data.name || doc.id,
        phone: data.phone || '',
        balance: Number(data.balance) || 0,
        role: data.role || 'user',
        level: data.level || 'Retailer',
        verified: data.verified !== false,
        deviceDetails: data.deviceDetails || 'Registered Device',
        password: data.password || '123456',
        pin: data.pin || '1234',
        deviceLocked: data.deviceLocked || false,
        twoStepEnabled: data.twoStepEnabled || false,
      });
    });

    if (users.length === 0) {
      // Seed primary admin
      const defaultAdmin: User = {
        id: 'admin_primary_id',
        name: 'Bayzid Telecom Owner',
        phone: 'bayzidtelecom1@gmail.com',
        balance: 0,
        role: 'admin',
        level: 'Distributor',
        verified: true,
        deviceDetails: 'Owner Device',
        password: 'Bayzid@#2023',
        pin: '2023',
        deviceLocked: false,
        twoStepEnabled: true
      };
      await createUserProfile(defaultAdmin);
      return [defaultAdmin];
    }

    return users;
  } catch (err) {
    console.warn('Error fetching reseller profiles from Firebase:', err);
    return [];
  }
}

export async function updateUserProfile(userId: string, fields: Partial<User>): Promise<boolean> {
  try {
    const docRef = doc(db, 'users', userId);
    const payload: any = {};
    if (fields.balance !== undefined) payload.balance = fields.balance;
    if (fields.level) payload.level = fields.level;
    if (fields.password) payload.password = fields.password;
    if (fields.pin) payload.pin = fields.pin;
    if (fields.verified !== undefined) payload.verified = fields.verified;
    if (fields.name) payload.name = fields.name;
    if (fields.phone) payload.phone = fields.phone;

    await setDoc(docRef, payload, { merge: true });
    return true;
  } catch (err) {
    console.warn('Error updating user profile:', err);
    return false;
  }
}

export async function createUserProfile(user: User): Promise<boolean> {
  try {
    const docRef = doc(db, 'users', user.id);
    await setDoc(docRef, {
      name: user.name,
      phone: user.phone,
      balance: user.balance || 0,
      role: user.role || 'user',
      level: user.level || 'Retailer',
      verified: user.verified !== false,
      deviceDetails: user.deviceDetails || 'Registered Device',
      password: user.password || '123456',
      pin: user.pin || '1234',
      deviceLocked: user.deviceLocked || false,
      twoStepEnabled: user.twoStepEnabled || false,
      createdAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn('Error creating user profile:', err);
    return false;
  }
}

// 4. Deposits
export async function fetchDeposits(): Promise<BalanceRequest[] | null> {
  try {
    const q = query(collection(db, 'deposits'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const deposits: BalanceRequest[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      deposits.push({
        id: doc.id,
        userId: data.userId,
        userName: data.userName || 'Reseller',
        amount: Number(data.amount) || 0,
        senderNumber: data.senderNumber || '',
        transactionId: data.transactionId || '',
        method: data.method as 'bKash' | 'Nagad' | 'Rocket',
        status: data.status as 'Pending' | 'Approved' | 'Rejected',
        createdAt: data.createdAt
      });
    });
    return deposits;
  } catch (err) {
    console.warn('Error fetching deposits:', err);
    return [];
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
    const userSnap = await getDoc(doc(db, 'users', userId));
    const userName = userSnap.exists() ? (userSnap.data()?.name || 'Reseller') : 'Reseller';

    await addDoc(collection(db, 'deposits'), {
      userId,
      userName,
      method,
      amount,
      senderNumber,
      transactionId,
      status: 'Pending',
      createdAt: new Date().toISOString()
    });
    return true;
  } catch (err) {
    console.warn('Error creating deposit request:', err);
    throw err;
  }
}

export async function approveDepositRequest(depositId: string, amount: number): Promise<boolean> {
  try {
    await runTransaction(db, async (transaction) => {
      const depositRef = doc(db, 'deposits', depositId);
      const depositSnap = await transaction.get(depositRef);

      if (!depositSnap.exists()) {
        throw new Error('Deposit record does not exist');
      }

      const depositData = depositSnap.data();
      if (depositData.status !== 'Pending') {
        throw new Error('Deposit is not pending');
      }

      const userId = depositData.userId;
      const userRef = doc(db, 'users', userId);
      const userSnap = await transaction.get(userRef);

      if (!userSnap.exists()) {
        throw new Error('User does not exist');
      }

      const currentBalance = Number(userSnap.data().balance) || 0;
      const newBalance = currentBalance + amount;

      transaction.update(userRef, { balance: newBalance });
      transaction.update(depositRef, { status: 'Approved' });
    });

    return true;
  } catch (err) {
    console.warn('Transaction failed for approving deposit:', err);
    return false;
  }
}

export async function rejectDepositRequest(depositId: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'deposits', depositId);
    await updateDoc(docRef, { status: 'Rejected' });
    return true;
  } catch (err) {
    console.warn('Error rejecting deposit request:', err);
    return false;
  }
}

// 5. Orders
export async function fetchOrders(): Promise<OfferOrder[] | null> {
  try {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const orders: OfferOrder[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      orders.push({
        id: doc.id,
        userId: data.userId,
        userName: data.userName || 'Reseller',
        offerId: data.offerId,
        offerTitle: data.offerTitle || 'Telecom Package',
        operator: (data.operator || 'GP') as OperatorName,
        offerPrice: Number(data.offerPrice) || 0,
        targetPhone: data.targetPhone || '',
        status: data.status as 'Pending' | 'Successful' | 'Canceled',
        createdAt: data.createdAt
      });
    });
    return orders;
  } catch (err) {
    console.warn('Error fetching orders:', err);
    return [];
  }
}

export async function purchaseOfferRPC(
  userId: string,
  offerId: string,
  targetNumber: string,
  price: number
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    let finalOrderId: string | undefined;

    await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', userId);
      const userSnap = await transaction.get(userRef);

      if (!userSnap.exists()) {
        throw new Error('User profile not found');
      }

      const userBalance = Number(userSnap.data().balance) || 0;
      if (userBalance < price) {
        throw new Error('Insufficient balance');
      }

      let offerTitle = 'Drive Pack';
      let operator = 'GP';

      if (offerId.startsWith('recharge_')) {
        const opFromId = offerId.split('_')[1] || 'GP';
        operator = opFromId;
        offerTitle = `Flexiload ${price} Tk`;
      } else {
        const offerRef = doc(db, 'offers', offerId);
        const offerSnap = await transaction.get(offerRef);

        if (!offerSnap.exists()) {
          throw new Error('Offer not found');
        }

        const offerData = offerSnap.data();
        offerTitle = offerData.title || 'Drive Pack';
        operator = offerData.operator || 'GP';
      }

      transaction.update(userRef, { balance: userBalance - price });

      const newOrderRef = doc(collection(db, 'orders'));
      transaction.set(newOrderRef, {
        userId,
        userName: userSnap.data().name || 'Reseller',
        offerId,
        offerTitle,
        operator,
        offerPrice: price,
        targetPhone: targetNumber,
        status: 'Pending',
        createdAt: new Date().toISOString()
      });

      finalOrderId = newOrderRef.id;
    });

    return { success: true, orderId: finalOrderId };
  } catch (err: any) {
    console.warn('Error in purchase transaction:', err);
    return { success: false, error: err.message || 'Unknown purchase error' };
  }
}

export async function completeOrder(orderId: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'orders', orderId);
    await updateDoc(docRef, { status: 'Successful' });
    return true;
  } catch (err) {
    console.warn('Error completing order:', err);
    return false;
  }
}

export async function cancelAndRefundOrderRPC(orderId: string, refundAmount: number): Promise<boolean> {
  try {
    await runTransaction(db, async (transaction) => {
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await transaction.get(orderRef);

      if (!orderSnap.exists()) {
        throw new Error('Order not found');
      }

      const orderData = orderSnap.data();
      if (orderData.status !== 'Pending') {
        throw new Error('Order is not pending');
      }

      const userId = orderData.userId;
      const userRef = doc(db, 'users', userId);
      const userSnap = await transaction.get(userRef);

      if (!userSnap.exists()) {
        throw new Error('User profile not found for refund');
      }

      const currentBalance = Number(userSnap.data().balance) || 0;

      transaction.update(userRef, { balance: currentBalance + refundAmount });
      transaction.update(orderRef, { status: 'Canceled' });
    });

    return true;
  } catch (err) {
    console.warn('Error refunding order:', err);
    return false;
  }
}

// 6. Danger Zone Operations
export async function deleteAllOrders(): Promise<boolean> {
  try {
    const querySnapshot = await getDocs(collection(db, 'orders'));
    for (const doc of querySnapshot.docs) {
      await deleteDoc(doc.ref);
    }
    return true;
  } catch (err) {
    console.warn('Error deleting all orders:', err);
    return false;
  }
}

export async function deleteAllDeposits(): Promise<boolean> {
  try {
    const querySnapshot = await getDocs(collection(db, 'deposits'));
    for (const doc of querySnapshot.docs) {
      await deleteDoc(doc.ref);
    }
    return true;
  } catch (err) {
    console.warn('Error deleting all deposits:', err);
    return false;
  }
}

export async function deleteAllUsersExceptAdmin(): Promise<boolean> {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    for (const doc of querySnapshot.docs) {
      if (doc.data().role !== 'admin') {
        await deleteDoc(doc.ref);
      }
    }
    return true;
  } catch (err) {
    console.warn('Error deleting all users:', err);
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
    const userPass = password || '123456';
    const userPin = pin || '1234';
    const customUserId = `usr_${cleanPhone}`;

    const newUser: User = {
      id: customUserId,
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
    };

    const success = await createUserProfile(newUser);
    return success ? newUser : null;
  } catch (err) {
    console.warn('Error in adminCreateUser:', err);
    return null;
  }
}
