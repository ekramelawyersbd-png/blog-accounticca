/**
 * Utility for redirecting user inquiries, consultation bookings,
 * and lawyer communication to the centralized Accounticca contact & inquiry desk.
 * Destination: /contact
 */

export interface AppointmentRedirectParams {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  service?: string;
  practiceArea?: string;
  area?: string;
  expertise?: string;
  mode?: 'virtual' | 'in_person';
  lawyer?: string;
  notes?: string;
  message?: string;
  topic?: string;
  date?: string;
  time?: string;
  source?: string;
  tab?: 'appointment' | 'inquiry';
}

export const APPOINTMENT_BASE_URL = '/contact';

/**
 * Maps arbitrary service/role titles to standard practice area slugs
 */
export function mapServiceToPracticeArea(service?: string): string {
  if (!service) return 'tax';
  const s = service.toLowerCase();
  if (s.includes('vat') || s.includes('mushak') || s.includes('customs')) return 'vat';
  if (s.includes('litigation') || s.includes('high court') || s.includes('dispute') || s.includes('contract') || s.includes('barrister')) return 'corporate-law';
  if (s.includes('rjsc') || s.includes('incorporation') || s.includes('company reg') || s.includes('secretarial')) return 'rjsc';
  if (s.includes('audit') || s.includes('assurance') || s.includes('forensic')) return 'audit';
  if (s.includes('cfo') || s.includes('finance') || s.includes('fundraising') || s.includes('modeling')) return 'cfo';
  if (s.includes('tax') || s.includes('nbr') || s.includes('tds') || s.includes('assessment')) return 'tax';
  return 'tax';
}

/**
 * Builds the destination contact/appointment URL preserving any relevant user-entered information
 * as standard query parameters for seamless prefilling.
 */
export function buildAppointmentUrl(params?: AppointmentRedirectParams): string {
  try {
    const searchParams = new URLSearchParams();

    if (!params) {
      return APPOINTMENT_BASE_URL;
    }

    // Default to tab=appointment if consultation parameters are provided
    const tab = params.tab || (params.area || params.practiceArea || params.lawyer || params.time || params.date || params.expertise ? 'appointment' : undefined);
    if (tab) {
      searchParams.set('tab', tab);
    }

    // Practice Area routing
    const targetArea = params.area || params.practiceArea || (params.service ? mapServiceToPracticeArea(params.service) : undefined);
    if (targetArea && targetArea.trim()) {
      searchParams.set('area', targetArea.trim().toLowerCase());
    }

    if (params.expertise && params.expertise.trim()) {
      searchParams.set('expertise', params.expertise.trim());
    }

    if (params.mode) {
      searchParams.set('mode', params.mode);
    }

    if (params.name && params.name.trim()) {
      searchParams.set('name', params.name.trim());
    }

    if (params.email && params.email.trim()) {
      searchParams.set('email', params.email.trim());
    }

    if (params.phone && params.phone.trim()) {
      searchParams.set('phone', params.phone.trim());
    }

    if (params.company && params.company.trim()) {
      searchParams.set('company', params.company.trim());
    }

    if (params.service && params.service.trim()) {
      searchParams.set('service', params.service.trim());
    }

    if (params.lawyer && params.lawyer.trim()) {
      searchParams.set('lawyer', params.lawyer.trim());
    }

    const notes = params.notes || params.message || params.topic;
    if (notes && notes.trim()) {
      searchParams.set('notes', notes.trim());
    }

    if (params.date && params.date.trim()) {
      searchParams.set('date', params.date.trim());
    }

    if (params.time && params.time.trim()) {
      searchParams.set('time', params.time.trim());
    }

    if (params.source && params.source.trim()) {
      searchParams.set('source', params.source.trim());
    }

    const query = searchParams.toString();
    return query ? `${APPOINTMENT_BASE_URL}?${query}` : APPOINTMENT_BASE_URL;
  } catch {
    return APPOINTMENT_BASE_URL;
  }
}

/**
 * Redirects user directly to the designated contact/appointment route.
 */
export function redirectToAppointment(params?: AppointmentRedirectParams): void {
  const destinationUrl = buildAppointmentUrl(params);
  if (typeof window !== 'undefined') {
    window.location.href = destinationUrl;
  }
}
