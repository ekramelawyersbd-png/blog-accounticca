import React, { useState } from 'react';
import { 
  MapPin, 
  Navigation, 
  ExternalLink, 
  Clock, 
  Car, 
  Building2, 
  Phone, 
  Copy, 
  Check, 
  Compass,
  Layers,
  ShieldCheck
} from 'lucide-react';

interface OfficeLocationMapProps {
  primaryPhone?: string;
  rawTelNumber?: string;
}

export function OfficeLocationMap({ 
  primaryPhone = '+880 1335-230170', 
  rawTelNumber = '+8801335230170' 
}: OfficeLocationMapProps) {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');

  const fullAddress = 'Suite G-5, BTI Centara Grand, 144–144/1 Green Road, Panthapath, Dhaka–1205, Bangladesh';
  const googleMapsDirectionsUrl = 'https://www.google.com/maps/dir/?api=1&destination=BTI+Centara+Grand+144+Green+Road+Panthapath+Dhaka+1205';
  const googleMapsSearchUrl = 'https://www.google.com/maps/search/?api=1&query=BTI+Centara+Grand+144+Green+Road+Panthapath+Dhaka+1205';

  // Embed URL for BTI Centara Grand, Panthapath, Green Road, Dhaka
  const embedMapUrl = `https://maps.google.com/maps?q=BTI+Centara+Grand,+144+Green+Road,+Panthapath,+Dhaka+1205&t=${mapType === 'satellite' ? 'k' : ''}&z=16&ie=UTF8&iwloc=&output=embed`;

  const handleCopyAddress = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullAddress);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2500);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-sm overflow-hidden relative">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>Interactive Head Office Location</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Visit Our Executive Chambers
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-xl">
            Centrally situated at BTI Centara Grand on Green Road, Panthapath — bridging Dhaka’s principal corporate and commercial corridors.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Map Type Switcher */}
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
            <button
              onClick={() => setMapType('roadmap')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                mapType === 'roadmap' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Default Map
            </button>
            <button
              onClick={() => setMapType('satellite')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                mapType === 'satellite' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Satellite View
            </button>
          </div>

          <a
            href={googleMapsDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs hover:shadow-md group"
          >
            <Navigation className="w-3.5 h-3.5 group-hover:rotate-45 transition-transform" />
            <span>Get Live Directions</span>
            <ExternalLink className="w-3 h-3 text-emerald-200" />
          </a>
        </div>
      </div>

      {/* Main Grid: Map Embed (Left) & Location Briefing Cards (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Interactive Map Frame (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100 relative min-h-[380px] sm:min-h-[440px] flex flex-col">
          {/* Map Loading Skeleton/Overlay */}
          {!isMapLoaded && (
            <div className="absolute inset-0 bg-slate-100 flex flex-col items-center justify-center p-6 text-center z-10 animate-pulse">
              <Compass className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
              <p className="text-xs font-bold text-slate-700">Loading Panthapath Chambers Map...</p>
              <p className="text-[11px] text-slate-500">BTI Centara Grand, 144 Green Road</p>
            </div>
          )}

          <iframe
            title="ACCOUNTICCA × E-LAWYERS Head Office Map"
            src={embedMapUrl}
            width="100%"
            height="100%"
            className="w-full h-full min-h-[380px] sm:min-h-[440px] border-0"
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            onLoad={() => setIsMapLoaded(true)}
          />

          {/* Interactive Floating Badge on Map */}
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-sm bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/90 shadow-lg z-20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <h4 className="text-xs font-bold text-slate-900 truncate">
                  BTI Centara Grand (Suite G-5)
                </h4>
                <p className="text-[11px] text-emerald-700 font-medium truncate">
                  ACCOUNTICCA × E-LAWYERS Head Office
                </p>
              </div>
            </div>

            <a
              href={googleMapsSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline shrink-0"
            >
              Full Screen
            </a>
          </div>
        </div>

        {/* Office Details & Navigation Information (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          {/* Address & Copy Block */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                Official Postal Address
              </span>
              <button
                onClick={handleCopyAddress}
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs transition-colors"
                title="Copy Address"
              >
                {copiedAddress ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <address className="not-italic text-sm text-slate-800 font-medium leading-relaxed">
              <span className="block font-bold text-slate-900 text-base">
                ACCOUNTICCA × E-LAWYERS
              </span>
              Suite G-5, BTI Centara Grand<br />
              144–144/1 Green Road, Panthapath<br />
              Dhaka–1205, Bangladesh
            </address>

            <div className="pt-2 border-t border-slate-200/70 text-xs text-slate-600 space-y-1.5">
              <div className="flex items-start gap-2">
                <Compass className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Key Landmarks:</strong> Near Square Hospital, Bashundhara City Shopping Mall, and Green Road Panthapath Intersection.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Car className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Parking Facility:</strong> Dedicated basement and ground-level client parking with 24/7 building security.
                </span>
              </div>
            </div>
          </div>

          {/* Office Hours & Consultation Schedule */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Chambers Schedule &amp; Reception
            </span>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-200/70">
                <span className="text-slate-500 block mb-0.5">Working Days</span>
                <span className="font-bold text-slate-900">Sunday – Thursday</span>
                <span className="text-[11px] text-emerald-700 block mt-1">9:30 AM – 6:30 PM</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200/70">
                <span className="text-slate-500 block mb-0.5">Weekend Support</span>
                <span className="font-bold text-slate-900">Friday – Saturday</span>
                <span className="text-[11px] text-slate-500 block mt-1">By Prior Appointment</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
              <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Prior booking strongly advised to ensure senior partners are reserved.</span>
            </div>
          </div>

          {/* Quick Connect Trigger */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-emerald-950 text-white flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-[11px] font-mono text-emerald-400">Reception Desk Hotline</span>
              <p className="text-sm font-bold">{primaryPhone}</p>
            </div>

            <a
              href={`tel:${rawTelNumber}`}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shadow-xs"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Reception</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
