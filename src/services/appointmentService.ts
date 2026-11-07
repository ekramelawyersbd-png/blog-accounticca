import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  serverTimestamp,
  orderBy,
  addDoc
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export type AppointmentStatus = 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed';

export interface AppointmentRating {
  rating: number; // 1 to 5 stars
  feedback: string; // client review comments
  aspects?: {
    expertise?: number; // 1 to 5
    clarity?: number; // 1 to 5
    professionalism?: number; // 1 to 5
    responsiveness?: number; // 1 to 5
  };
  recommend?: boolean;
  submittedAt: string; // ISO date string
  updatedAt?: string;
}

export interface Appointment {
  id: string;
  referenceId: string;
  practiceArea: string;
  practiceAreaId?: string;
  expertiseArea?: string;
  assignedPartner?: {
    name: string;
    title: string;
    chamber?: string;
    division?: string;
  };
  division?: string;
  mode: 'virtual' | 'in_person';
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "10:00 AM - 10:45 AM BST"
  clientName: string;
  email: string;
  phone: string;
  companyName: string;
  notes?: string;
  userId?: string | null;
  userEmail?: string;
  status: AppointmentStatus;
  createdAt: string;
  updatedAt?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  meetingLink?: string;
  chamberLocation?: string;
  chamberHotline?: string;
  rating?: AppointmentRating;
  reminderSent?: boolean;
  lastReminderSentAt?: string;
  reminderMessageId?: string;
  lastNotification?: {
    status: AppointmentStatus;
    sentAt: string;
    recipient: string;
    messageId?: string;
    subject?: string;
  };
}

import { dispatchAppointmentStatusNotification } from './emailNotificationService';

const COLLECTION_NAME = 'appointments';
const LOCAL_STORAGE_KEY_PREFIX = 'accounticca_appointments_';
const SHARED_BOOKED_KEY = 'accounticca_booked_appointments';

export const PRACTICE_DIVISIONS: Record<string, string> = {
  'Income Tax & Corporate Assessment': 'Accounticca Advisory',
  'Income Tax Assessment & NBR Defense': 'Accounticca Advisory',
  'VAT & SD Act Compliance & Reconciliations': 'Accounticca Advisory',
  'VAT & Customs Dispute Management': 'Accounticca Advisory',
  'Corporate Law & Commercial Litigation': 'E-Lawyers Chambers',
  'Corporate Law & Litigation Advisory': 'E-Lawyers Chambers',
  'RJSC Company Incorporation & Secretarial': 'E-Lawyers Chambers',
  'Statutory Financial Audit & Assurance': 'Accounticca Advisory',
  'Fractional CFO & Corporate Finance': 'Accounticca Advisory'
};

export const CHAMBER_ADDRESS = 'Suite G-5, BTI Centara Grand, 144 Green Road, Panthapath, Dhaka-1205';
export const CHAMBER_HOTLINE = '+880 1335-230170';
export const DEFAULT_MEET_LINK = 'https://meet.google.com/qmv-trcx-vny';

/**
 * Normalizes appointment status string to 'Pending' | 'Confirmed' | 'Cancelled'
 */
export function normalizeStatus(rawStatus?: string): AppointmentStatus {
  if (!rawStatus) return 'Confirmed';
  const lower = rawStatus.toLowerCase();
  if (lower === 'pending') return 'Pending';
  if (lower === 'cancelled' || lower === 'canceled') return 'Cancelled';
  return 'Confirmed';
}

/**
 * Creates seed appointments for first-time or preview users so they can inspect status tracking
 */
export function createSeedAppointments(userInfo: {
  uid: string;
  email?: string | null;
  displayName?: string | null;
}): Appointment[] {
  const email = userInfo.email || 'client@corporate.bd';
  const name = userInfo.displayName || 'Corporate Counsel';

  const today = new Date();
  
  // Date 1: Confirmed upcoming appointment tomorrow (occurring within 24 hours!)
  const date1 = new Date(today);
  date1.setDate(today.getDate() + 1);
  const date1Str = date1.toISOString().split('T')[0];

  // Date 2: Pending appointment (+4 days)
  const date2 = new Date(today);
  date2.setDate(today.getDate() + 4);
  if (date2.getDay() === 5) date2.setDate(date2.getDate() + 1);
  const date2Str = date2.toISOString().split('T')[0];

  // Date 3: Past / Cancelled consultation (-3 days)
  const date3 = new Date(today);
  date3.setDate(today.getDate() - 3);
  const date3Str = date3.toISOString().split('T')[0];

  // Date 4: Past Confirmed consultation ready for post-appointment rating (-5 days)
  const date4 = new Date(today);
  date4.setDate(today.getDate() - 5);
  const date4Str = date4.toISOString().split('T')[0];

  // Date 5: Past Confirmed consultation with verified completed rating (-12 days)
  const date5 = new Date(today);
  date5.setDate(today.getDate() - 12);
  const date5Str = date5.toISOString().split('T')[0];

  return [
    {
      id: `seed-apt-1-${userInfo.uid.slice(0, 6)}`,
      referenceId: 'APT-2026-92841',
      practiceArea: 'Corporate Law & Litigation Advisory',
      division: 'E-Lawyers Chambers',
      mode: 'virtual',
      date: date1Str,
      timeSlot: '11:30 AM - 12:15 PM BST',
      clientName: name,
      email,
      phone: '+880 1712-345678',
      companyName: 'Apex Logistics & Tech Ltd.',
      notes: 'Consultation regarding High Court company bench jurisdiction and joint venture contract clause restructuring.',
      userId: userInfo.uid,
      userEmail: email,
      status: 'Confirmed',
      meetingLink: DEFAULT_MEET_LINK,
      createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
    },
    {
      id: `seed-apt-2-${userInfo.uid.slice(0, 6)}`,
      referenceId: 'APT-2026-64192',
      practiceArea: 'Income Tax & Corporate Assessment',
      division: 'Accounticca Advisory',
      mode: 'in_person',
      date: date2Str,
      timeSlot: '03:45 PM - 04:30 PM BST',
      clientName: name,
      email,
      phone: '+880 1712-345678',
      companyName: 'Apex Logistics & Tech Ltd.',
      notes: 'Review of Section 163 minimum tax assessment order and advance income tax credit reconciliation.',
      userId: userInfo.uid,
      userEmail: email,
      status: 'Pending',
      chamberLocation: CHAMBER_ADDRESS,
      chamberHotline: CHAMBER_HOTLINE,
      createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString()
    },
    {
      id: `seed-apt-4-${userInfo.uid.slice(0, 6)}`,
      referenceId: 'APT-2026-47120',
      practiceArea: 'Statutory Financial Audit & Assurance',
      division: 'Accounticca Advisory',
      mode: 'virtual',
      date: date4Str,
      timeSlot: '10:00 AM - 10:45 AM BST',
      clientName: name,
      email,
      phone: '+880 1712-345678',
      companyName: 'Apex Logistics & Tech Ltd.',
      notes: 'Post-audit statutory debrief regarding IFRS 16 lease disclosures and BSEC corporate governance compliance verification.',
      userId: userInfo.uid,
      userEmail: email,
      status: 'Confirmed',
      meetingLink: DEFAULT_MEET_LINK,
      createdAt: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: `seed-apt-5-${userInfo.uid.slice(0, 6)}`,
      referenceId: 'APT-2026-11893',
      practiceArea: 'RJSC Company Incorporation & Secretarial',
      division: 'E-Lawyers Chambers',
      mode: 'in_person',
      date: date5Str,
      timeSlot: '04:00 PM - 04:45 PM BST',
      clientName: name,
      email,
      phone: '+880 1712-345678',
      companyName: 'Apex Logistics & Tech Ltd.',
      notes: 'Authorized capital enlargement filings and RJSC certified true copy authentication.',
      userId: userInfo.uid,
      userEmail: email,
      status: 'Confirmed',
      chamberLocation: CHAMBER_ADDRESS,
      chamberHotline: CHAMBER_HOTLINE,
      rating: {
        rating: 5,
        feedback: 'Outstanding chamber advisory. Barrister Rahman provided exceptional clarity on RJSC Schedule X documentation. The entire corporate filing was completed ahead of deadline.',
        aspects: {
          expertise: 5,
          clarity: 5,
          professionalism: 5,
          responsiveness: 5
        },
        recommend: true,
        submittedAt: new Date(Date.now() - 11 * 24 * 3600 * 1000).toISOString()
      },
      createdAt: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: `seed-apt-3-${userInfo.uid.slice(0, 6)}`,
      referenceId: 'APT-2026-38205',
      practiceArea: 'VAT & Customs Dispute Management',
      division: 'Accounticca Advisory',
      mode: 'virtual',
      date: date3Str,
      timeSlot: '02:30 PM - 03:15 PM BST',
      clientName: name,
      email,
      phone: '+880 1712-345678',
      companyName: 'Apex Logistics & Tech Ltd.',
      notes: 'Mushak 9.1 return amendment and input tax rebate claim inquiry.',
      userId: userInfo.uid,
      userEmail: email,
      status: 'Cancelled',
      cancellationReason: 'Matter resolved internally with commissionerate before chamber date.',
      cancelledAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString()
    }
  ];
}

/**
 * Fetch appointments for the authenticated user from Firestore with LocalStorage cache/offline support
 */
export async function fetchUserAppointments(userId: string, userEmail?: string): Promise<Appointment[]> {
  const appointmentsMap = new Map<string, Appointment>();

  // 1. Try querying Firestore
  try {
    const appointmentsRef = collection(db, COLLECTION_NAME);
    
    // Query by userId
    if (userId) {
      try {
        const qUserId = query(appointmentsRef, where('userId', '==', userId));
        const snap = await getDocs(qUserId);
        snap.forEach(docSnap => {
          const data = docSnap.data();
          const item: Appointment = {
            id: docSnap.id,
            referenceId: data.referenceId || `APT-${docSnap.id.slice(0, 8).toUpperCase()}`,
            practiceArea: data.practiceArea || 'General Compliance Advisory',
            practiceAreaId: data.practiceAreaId,
            expertiseArea: data.expertiseArea,
            assignedPartner: data.assignedPartner,
            division: data.division || PRACTICE_DIVISIONS[data.practiceArea] || 'Accounticca Advisory',
            mode: data.mode === 'in_person' ? 'in_person' : 'virtual',
            date: data.date || '',
            timeSlot: data.timeSlot || '10:00 AM - 10:45 AM BST',
            clientName: data.clientName || 'Valued Client',
            email: data.email || userEmail || '',
            phone: data.phone || '',
            companyName: data.companyName || 'Corporate Client',
            notes: data.notes || '',
            userId: data.userId || userId,
            userEmail: data.userEmail || userEmail,
            status: normalizeStatus(data.status),
            cancellationReason: data.cancellationReason,
            cancelledAt: data.cancelledAt,
            meetingLink: data.mode === 'virtual' ? (data.meetingLink || DEFAULT_MEET_LINK) : undefined,
            chamberLocation: data.mode === 'in_person' ? (data.chamberLocation || CHAMBER_ADDRESS) : undefined,
            chamberHotline: CHAMBER_HOTLINE,
            rating: data.rating || undefined,
            lastNotification: data.lastNotification || undefined,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString()),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : undefined
          };
          appointmentsMap.set(item.referenceId || item.id, item);
        });
      } catch (err) {
        console.warn('Note: Could not query appointments by userId:', err);
      }
    }

    // Query by userEmail if available
    if (userEmail) {
      try {
        const qEmail = query(appointmentsRef, where('email', '==', userEmail));
        const snapEmail = await getDocs(qEmail);
        snapEmail.forEach(docSnap => {
          const data = docSnap.data();
          const refKey = data.referenceId || docSnap.id;
          if (!appointmentsMap.has(refKey)) {
            const item: Appointment = {
              id: docSnap.id,
              referenceId: data.referenceId || `APT-${docSnap.id.slice(0, 8).toUpperCase()}`,
              practiceArea: data.practiceArea || 'General Compliance Advisory',
              practiceAreaId: data.practiceAreaId,
              expertiseArea: data.expertiseArea,
              assignedPartner: data.assignedPartner,
              division: data.division || PRACTICE_DIVISIONS[data.practiceArea] || 'Accounticca Advisory',
              mode: data.mode === 'in_person' ? 'in_person' : 'virtual',
              date: data.date || '',
              timeSlot: data.timeSlot || '10:00 AM - 10:45 AM BST',
              clientName: data.clientName || 'Valued Client',
              email: data.email || userEmail,
              phone: data.phone || '',
              companyName: data.companyName || 'Corporate Client',
              notes: data.notes || '',
              userId: data.userId || userId,
              userEmail: data.userEmail || userEmail,
              status: normalizeStatus(data.status),
              cancellationReason: data.cancellationReason,
              cancelledAt: data.cancelledAt,
              meetingLink: data.mode === 'virtual' ? (data.meetingLink || DEFAULT_MEET_LINK) : undefined,
              chamberLocation: data.mode === 'in_person' ? (data.chamberLocation || CHAMBER_ADDRESS) : undefined,
              chamberHotline: CHAMBER_HOTLINE,
              rating: data.rating || undefined,
              lastNotification: data.lastNotification || undefined,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString()),
              updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : undefined
            };
            appointmentsMap.set(refKey, item);
          }
        });
      } catch (err) {
        console.warn('Note: Could not query appointments by email:', err);
      }
    }
  } catch (err) {
    console.warn('Firestore appointment query failed, falling back to local storage:', err);
  }

  // 2. Merge local storage bookings (from AppointmentBookingForm)
  try {
    const rawLocal = localStorage.getItem(SHARED_BOOKED_KEY);
    if (rawLocal) {
      const parsed: any[] = JSON.parse(rawLocal);
      parsed.forEach(localItem => {
        // Check if matches user
        const matchesUser = (localItem.userId && localItem.userId === userId) ||
          (userEmail && localItem.email && localItem.email.toLowerCase() === userEmail.toLowerCase()) ||
          !localItem.userId; // If booked anonymously in current browser session
        
        if (matchesUser) {
          const refKey = localItem.referenceId || `local-${localItem.date}`;
          if (!appointmentsMap.has(refKey)) {
            appointmentsMap.set(refKey, {
              id: localItem.id || refKey,
              referenceId: localItem.referenceId || refKey,
              practiceArea: localItem.practiceArea || 'Tax & Corporate Advisory',
              practiceAreaId: localItem.practiceAreaId,
              expertiseArea: localItem.expertiseArea,
              assignedPartner: localItem.assignedPartner,
              division: PRACTICE_DIVISIONS[localItem.practiceArea] || 'Accounticca Advisory',
              mode: localItem.mode === 'in_person' ? 'in_person' : 'virtual',
              date: localItem.date,
              timeSlot: localItem.timeSlot,
              clientName: localItem.clientName,
              email: localItem.email || userEmail || '',
              phone: localItem.phone || '',
              companyName: localItem.companyName || '',
              notes: localItem.notes || '',
              userId: localItem.userId || userId,
              userEmail: localItem.userEmail || userEmail,
              status: normalizeStatus(localItem.status || 'Confirmed'),
              cancellationReason: localItem.cancellationReason,
              cancelledAt: localItem.cancelledAt,
              meetingLink: localItem.mode === 'virtual' ? (localItem.meetingLink || DEFAULT_MEET_LINK) : undefined,
              chamberLocation: localItem.mode === 'in_person' ? (localItem.chamberLocation || CHAMBER_ADDRESS) : undefined,
              chamberHotline: CHAMBER_HOTLINE,
              rating: localItem.rating,
              lastNotification: localItem.lastNotification,
              createdAt: localItem.createdAt || new Date().toISOString()
            });
          }
        }
      });
    }
  } catch (err) {
    console.warn('Error parsing local appointments:', err);
  }

  // 3. Check user-specific local storage
  try {
    const userLocal = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${userId}`);
    if (userLocal) {
      const parsedUserList: Appointment[] = JSON.parse(userLocal);
      parsedUserList.forEach(item => {
        const key = item.referenceId || item.id;
        // User-specific updates override if status was updated locally
        if (appointmentsMap.has(key)) {
          const existing = appointmentsMap.get(key)!;
          if (item.status && item.status !== existing.status) {
            appointmentsMap.set(key, { ...existing, ...item });
          }
        } else {
          appointmentsMap.set(key, item);
        }
      });
    }
  } catch (err) {
    console.warn('Error parsing user specific appointments:', err);
  }

  const list = Array.from(appointmentsMap.values());

  // Sort descending by date
  list.sort((a, b) => {
    return new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime();
  });

  return list;
}

/**
 * Updates an appointment's status (Pending, Confirmed, Cancelled) in Firestore and local storage
 */
export async function updateAppointmentStatus(
  appointmentId: string, 
  referenceId: string,
  newStatus: AppointmentStatus, 
  userId: string,
  reason?: string
): Promise<void> {
  // 1. Try Firestore update
  try {
    // If appointmentId is a valid Firestore doc id
    if (appointmentId && !appointmentId.startsWith('seed-') && !appointmentId.startsWith('local-')) {
      const docRef = doc(db, COLLECTION_NAME, appointmentId);
      const updatePayload: Record<string, any> = {
        status: newStatus.toLowerCase(),
        updatedAt: serverTimestamp()
      };
      if (reason) {
        updatePayload.cancellationReason = reason;
        updatePayload.cancelledAt = new Date().toISOString();
      }
      await updateDoc(docRef, updatePayload);
    }
  } catch (err) {
    console.warn('Could not update Firestore appointment directly, persisting in local storage:', err);
  }

  // 2. Persist in user local storage
  try {
    const userKey = `${LOCAL_STORAGE_KEY_PREFIX}${userId}`;
    const raw = localStorage.getItem(userKey);
    let list: Appointment[] = raw ? JSON.parse(raw) : [];
    
    let found = false;
    list = list.map(item => {
      if (item.id === appointmentId || item.referenceId === referenceId) {
        found = true;
        return {
          ...item,
          status: newStatus,
          cancellationReason: reason || item.cancellationReason,
          cancelledAt: newStatus === 'Cancelled' ? new Date().toISOString() : item.cancelledAt,
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    });

    if (!found) {
      list.push({
        id: appointmentId,
        referenceId,
        practiceArea: 'Corporate Advisory',
        mode: 'virtual',
        date: new Date().toISOString().split('T')[0],
        timeSlot: '10:00 AM - 10:45 AM BST',
        clientName: 'Client',
        email: '',
        phone: '',
        companyName: '',
        status: newStatus,
        cancellationReason: reason,
        cancelledAt: newStatus === 'Cancelled' ? new Date().toISOString() : undefined,
        createdAt: new Date().toISOString()
      });
    }

    localStorage.setItem(userKey, JSON.stringify(list));
  } catch (e) {
    console.warn('Error saving to local storage:', e);
  }

  // 3. Also update shared booked list in local storage if present
  try {
    const rawShared = localStorage.getItem(SHARED_BOOKED_KEY);
    if (rawShared) {
      const sharedList: any[] = JSON.parse(rawShared);
      const updatedShared = sharedList.map(item => {
        if (item.referenceId === referenceId || item.id === appointmentId) {
          return {
            ...item,
            status: newStatus.toLowerCase(),
            cancellationReason: reason || item.cancellationReason,
            cancelledAt: newStatus === 'Cancelled' ? new Date().toISOString() : item.cancelledAt
          };
        }
        return item;
      });
      localStorage.setItem(SHARED_BOOKED_KEY, JSON.stringify(updatedShared));
    }
  } catch (e) {
    console.warn('Error updating shared booked key:', e);
  }

  // 4. Trigger automated email notification system for Confirmed or Cancelled status
  if (newStatus === 'Confirmed' || newStatus === 'Cancelled') {
    try {
      const userKey = `${LOCAL_STORAGE_KEY_PREFIX}${userId}`;
      const raw = localStorage.getItem(userKey);
      const list: Appointment[] = raw ? JSON.parse(raw) : [];
      const targetAppointment = list.find(item => item.id === appointmentId || item.referenceId === referenceId);
      if (targetAppointment) {
        dispatchAppointmentStatusNotification(targetAppointment, newStatus, reason)
          .then(({ notification }) => {
            // Update cached item with notification metadata
            const updatedWithNotif = list.map(item => {
              if (item.id === appointmentId || item.referenceId === referenceId) {
                return {
                  ...item,
                  lastNotification: {
                    status: newStatus,
                    sentAt: notification.sentAt,
                    recipient: notification.recipientEmail,
                    messageId: notification.messageId,
                    subject: notification.subject
                  }
                };
              }
              return item;
            });
            localStorage.setItem(userKey, JSON.stringify(updatedWithNotif));
          })
          .catch(err => {
            console.warn('[Email Notification Dispatch Notice]:', err);
          });
      }
    } catch (notifErr) {
      console.warn('Notification processing notice:', notifErr);
    }
  }
}

/**
 * Generate Google Calendar Link for appointment
 */
export function getGoogleCalendarUrl(booking: Appointment): string {
  const startHourMatch = booking.timeSlot.match(/^(\d{2}):(\d{2})\s*(AM|PM)/);
  let startHour = 10;
  let startMin = 0;
  if (startHourMatch) {
    startHour = parseInt(startHourMatch[1], 10);
    startMin = parseInt(startHourMatch[2], 10);
    if (startHourMatch[3] === 'PM' && startHour < 12) startHour += 12;
    if (startHourMatch[3] === 'AM' && startHour === 12) startHour = 0;
  }

  const [year, month, day] = booking.date.split('-').map(Number);
  const startDate = new Date(Date.UTC(year, month - 1, day, startHour - 6, startMin));
  const endDate = new Date(startDate.getTime() + 45 * 60 * 1000);

  const formatGCalDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const datesParam = `${formatGCalDate(startDate)}/${formatGCalDate(endDate)}`;

  const title = encodeURIComponent(`Consultation: ${booking.practiceArea} (Accounticca × E-Lawyers)`);
  const details = encodeURIComponent(
    `Appointment Ref: ${booking.referenceId}\nClient: ${booking.clientName} (${booking.companyName || 'Corporate Client'})\nPractice Focus: ${booking.practiceArea}\nStatus: ${booking.status}\nMode: ${booking.mode === 'virtual' ? 'Google Meet Video Call' : 'Chamber Consultation'}\nNotes: ${booking.notes || 'None'}\n\nChamber Contact: ${CHAMBER_HOTLINE}\nPanthapath, Dhaka, Bangladesh.`
  );
  const location = encodeURIComponent(
    booking.mode === 'virtual' 
      ? (booking.meetingLink || DEFAULT_MEET_LINK)
      : CHAMBER_ADDRESS
  );

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${datesParam}&details=${details}&location=${location}`;
}

/**
 * Generate and trigger download of .ics calendar file
 */
export function downloadIcsFile(booking: Appointment): void {
  const startHourMatch = booking.timeSlot.match(/^(\d{2}):(\d{2})\s*(AM|PM)/);
  let startHour = 10;
  let startMin = 0;
  if (startHourMatch) {
    startHour = parseInt(startHourMatch[1], 10);
    startMin = parseInt(startHourMatch[2], 10);
    if (startHourMatch[3] === 'PM' && startHour < 12) startHour += 12;
    if (startHourMatch[3] === 'AM' && startHour === 12) startHour = 0;
  }

  const [year, month, day] = booking.date.split('-').map(Number);
  const startDate = new Date(Date.UTC(year, month - 1, day, startHour - 6, startMin));
  const endDate = new Date(startDate.getTime() + 45 * 60 * 1000);

  const formatIcsDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Accounticca and E-Lawyers Chambers//Appointment Scheduler//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${booking.referenceId}-${Date.now()}@accounticca.com`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(startDate)}`,
    `DTEND:${formatIcsDate(endDate)}`,
    `SUMMARY:Consultation: ${booking.practiceArea} (Accounticca & E-Lawyers)`,
    `DESCRIPTION:Appointment Reference: ${booking.referenceId}\\nClient: ${booking.clientName}\\nStatus: ${booking.status}\\nTime: ${booking.timeSlot}`,
    `LOCATION:${booking.mode === 'virtual' ? 'Google Meet (' + (booking.meetingLink || DEFAULT_MEET_LINK) + ')' : CHAMBER_ADDRESS}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${booking.referenceId}-consultation.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Checks if the appointment date has passed
 */
export function isAppointmentPast(booking: { date: string; timeSlot?: string }): boolean {
  if (!booking.date) return false;
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    if (booking.date < todayStr) return true;
    if (booking.date > todayStr) return false;

    // Same date: check end time of slot (e.g. "10:00 AM - 10:45 AM BST")
    const match = booking.timeSlot?.match(/-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match) {
      let hour = parseInt(match[1], 10);
      const min = parseInt(match[2], 10);
      const isPM = match[3].toUpperCase() === 'PM';
      if (isPM && hour < 12) hour += 12;
      if (!isPM && hour === 12) hour = 0;

      const now = new Date();
      const slotEndToday = new Date();
      slotEndToday.setHours(hour, min, 0, 0);
      return now.getTime() > slotEndToday.getTime();
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Checks if the appointment is occurring within the next 24 hours
 */
export function isAppointmentWithin24Hours(booking: { date: string; timeSlot?: string }): boolean {
  if (!booking.date) return false;
  try {
    const parts = booking.date.split('-').map(Number);
    if (parts.length < 3 || isNaN(parts[0])) return false;
    const [year, month, day] = parts;

    let hour = 10;
    let min = 0;
    const match = (booking.timeSlot || '').match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match) {
      hour = parseInt(match[1], 10);
      min = parseInt(match[2], 10);
      const isPM = match[3].toUpperCase() === 'PM';
      if (isPM && hour < 12) hour += 12;
      if (!isPM && hour === 12) hour = 0;
    }

    // Bangladesh Standard Time is UTC+6
    const aptUtc = new Date(Date.UTC(year, month - 1, day, hour - 6, min, 0));
    const now = new Date();
    const diff = aptUtc.getTime() - now.getTime();
    return diff > 0 && diff <= 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

/**
 * Submits or updates a post-appointment rating and feedback review
 */
export async function submitAppointmentRating(
  appointmentId: string,
  referenceId: string,
  ratingData: Omit<AppointmentRating, 'submittedAt'> & { submittedAt?: string },
  userId: string
): Promise<AppointmentRating> {
  const finalRating: AppointmentRating = {
    ...ratingData,
    submittedAt: ratingData.submittedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // 1. Try Firestore update
  try {
    if (appointmentId && !appointmentId.startsWith('seed-') && !appointmentId.startsWith('local-')) {
      const appRef = doc(db, COLLECTION_NAME, appointmentId);
      await updateDoc(appRef, {
        rating: finalRating,
        updatedAt: serverTimestamp()
      });
    } else {
      // Look up by referenceId in Firestore
      const appointmentsRef = collection(db, COLLECTION_NAME);
      const q = query(appointmentsRef, where('referenceId', '==', referenceId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docRef = snap.docs[0].ref;
        await updateDoc(docRef, {
          rating: finalRating,
          updatedAt: serverTimestamp()
        });
      }
    }
  } catch (err) {
    console.warn('Note: Could not update rating directly in Firestore:', err);
  }

  // 2. Update user localStorage cache
  try {
    const userKey = `${LOCAL_STORAGE_KEY_PREFIX}${userId}`;
    const raw = localStorage.getItem(userKey);
    if (raw) {
      const list: Appointment[] = JSON.parse(raw);
      const updated = list.map(item => {
        if (item.id === appointmentId || item.referenceId === referenceId) {
          return {
            ...item,
            rating: finalRating,
            updatedAt: new Date().toISOString()
          };
        }
        return item;
      });
      localStorage.setItem(userKey, JSON.stringify(updated));
    }
  } catch (e) {
    console.warn('Error updating user cache with rating:', e);
  }

  // 3. Update shared booked appointments localStorage
  try {
    const rawShared = localStorage.getItem(SHARED_BOOKED_KEY);
    if (rawShared) {
      const shared: any[] = JSON.parse(rawShared);
      const updatedShared = shared.map(item => {
        if (item.id === appointmentId || item.referenceId === referenceId) {
          return {
            ...item,
            rating: finalRating,
            updatedAt: new Date().toISOString()
          };
        }
        return item;
      });
      localStorage.setItem(SHARED_BOOKED_KEY, JSON.stringify(updatedShared));
    }
  } catch (e) {
    console.warn('Error updating shared booked appointments with rating:', e);
  }

  return finalRating;
}
