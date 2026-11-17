import { useEffect, useRef } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Client-Side Active Session Appointment Reminder Scanner
 * 
 * Works collaboratively with the Node.js server cron to provide dual-engine
 * redundancy for automated 3-hour advance appointment reminder emails.
 * Scans confirmed Firestore bookings, sends pending reminders through /api/appointments/scan-reminders,
 * and updates Firestore documents so reminders are never sent more than once.
 */
export function useAppointmentReminderScanner(enabled: boolean = true) {
  const isScanningRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const runScan = async () => {
      if (isScanningRef.current) return;
      isScanningRef.current = true;

      try {
        const appointmentsRef = collection(db, 'appointments');
        const q = query(
          appointmentsRef,
          where('status', '==', 'confirmed')
        );

        const snap = await getDocs(q);
        if (snap.empty) {
          isScanningRef.current = false;
          return;
        }

        const now = Date.now();
        const pendingAppointments: any[] = [];

        snap.forEach((d) => {
          const data = d.data();
          // Skip if 3-hour reminder was already sent
          if (data.reminder3hSent === true || data.reminderSent === true) return;

          // Parse appointment date and time slot
          const dateStr = data.date;
          const timeSlotStr = data.timeSlot;
          if (!dateStr) return;

          const parts = dateStr.split('-').map(Number);
          if (parts.length < 3 || isNaN(parts[0])) return;
          const [year, month, day] = parts;

          let hour = 10;
          let min = 0;
          const match = (timeSlotStr || '').match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
          if (match) {
            hour = parseInt(match[1], 10);
            min = parseInt(match[2], 10);
            const meridian = match[3] ? match[3].toUpperCase() : '';
            if (meridian === 'PM' && hour < 12) hour += 12;
            if (meridian === 'AM' && hour === 12) hour = 0;
          }

          // BST is UTC+6
          const appointmentUtc = new Date(Date.UTC(year, month - 1, day, hour - 6, min, 0));
          const diffMs = appointmentUtc.getTime() - now;
          const diffHours = diffMs / (1000 * 60 * 60);

          // If session is scheduled within next 3.25 hours and is in the future
          if (diffMs > 0 && diffHours <= 3.25) {
            pendingAppointments.push({
              id: d.id,
              referenceId: data.referenceId,
              clientName: data.clientName,
              email: data.email || data.userEmail,
              phone: data.phone,
              companyName: data.companyName,
              practiceArea: data.practiceArea,
              mode: data.mode,
              date: data.date,
              timeSlot: data.timeSlot,
              status: 'Confirmed',
              meetingLink: data.meetingLink,
              leadPartnerEmail: data.assignedPartner?.email || 'ekram@elawyersbd.com'
            });
          }
        });

        if (pendingAppointments.length > 0) {
          const res = await fetch('/api/appointments/scan-reminders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ appointments: pendingAppointments })
          });

          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.results)) {
              for (const item of data.results) {
                if (item.id) {
                  try {
                    const docRef = doc(db, 'appointments', item.id);
                    await updateDoc(docRef, {
                      reminder3hSent: true,
                      reminder3hSentAt: serverTimestamp()
                    });
                  } catch (updateErr) {
                    console.warn('[Firestore Reminder Update Warning]', updateErr);
                  }
                }
              }
            }
          }
        }
      } catch (scanErr) {
        // Silent catch for resilience during transient offline intervals
        console.warn('[Client Appointment Scanner Notice]', scanErr);
      } finally {
        isScanningRef.current = false;
      }
    };

    // Run initial scan 5 seconds after page load
    const initialTimer = setTimeout(runScan, 5000);
    // Periodically run every 5 minutes during active user session
    const intervalTimer = setInterval(runScan, 5 * 60 * 1000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, [enabled]);
}
