import React, { useState } from 'react';
import { CalendarPlus, Trash2 } from 'lucide-react';
import { NeoCard } from '../common/NeoCard';
import { NeoButton } from '../common/NeoButton';
import { NeoInput } from '../common/NeoInput';
import { NeoBadge } from '../common/NeoBadge';
import { Dentist, WaitlistEntry, Patient, DentalService } from '../../types';
import { getTodayDateString } from '../../data/seedData';

interface WaitlistEngineProps {
  waitlist: WaitlistEntry[];
  patients: Patient[];
  services: DentalService[];
  dentists: Dentist[];
}

export const WaitlistEngine: React.FC<WaitlistEngineProps> = ({
  waitlist,
  patients,
  services,
  dentists
}) => {
  const activeWaitlistCount = waitlist.filter((w) => w.status === 'active').length;
  const today = getTodayDateString();

  return (
    <NeoCard className="space-y-4">
      <div className="border-b border-slate-300/40 pb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Cancellation Priority Waitlist Engine</h3>
          <p className="text-xs text-slate-500">
            When an appointment is cancelled, the matching engine automatically checks these records and sends notifications.
          </p>
        </div>
        <NeoBadge variant="info">Active Queue: {activeWaitlistCount}</NeoBadge>
      </div>

      <div className="space-y-3">
        {waitlist.length === 0 ? (
          <div className="p-8 neo-inset rounded-2xl text-center text-xs text-slate-400">
            No patients on waitlist.
          </div>
        ) : (
          waitlist.map((w) => {
            const pat = patients.find((p) => p.id === w.patientId);
            const srv = services.find((s) => s.id === w.serviceId);
            const dnt = dentists.find((d) => d.id === w.preferredDentistId);

            return (
              <div key={w.id} className="p-4 rounded-2xl neo-raised bg-[#E8EEF5] flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-xs">{pat?.fullName}</span>
                    <span className="text-slate-500 text-[11px]">({pat?.phone})</span>
                    <NeoBadge variant={w.status === 'notified' ? 'warning' : 'primary'} size="sm">
                      {w.status.toUpperCase()}
                    </NeoBadge>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Target: {w.preferredDate} ({w.preferredTimeRange}) • {srv?.name} {dnt ? `• Dr. ${dnt.fullName}` : ''}
                  </p>
                  {w.notes && <p className="text-[11px] text-slate-400 mt-1 italic">{w.notes}</p>}
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Enrolled on</span>
                  <span className="text-xs font-semibold text-slate-600">
                    {new Date(w.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </NeoCard>
  );
};
