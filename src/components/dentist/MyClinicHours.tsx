import React from 'react';
import {
  Clock,
  Calendar,
  Coffee,
  MapPin,
  Stethoscope,
  ShieldCheck,
  XCircle
} from 'lucide-react';
import { useDentalStore } from '../../services/useDentalStore';
import { NeoCard } from '../common/NeoCard';
import { NeoButton } from '../common/NeoButton';
import { NeoBadge } from '../common/NeoBadge';
import { DentistSchedule, BlockedSchedule } from '../../types';
import { getTodayDateString } from '../../data/seedData';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface MyClinicHoursProps {
  onNavigateToOperatory?: () => void;
}

export const MyClinicHours: React.FC<MyClinicHoursProps> = ({
  onNavigateToOperatory
}) => {
  const {
    activeUser,
    dentists,
    schedules,
    blockedSchedules,
    settings
  } = useDentalStore();

  const today = getTodayDateString();
  const currentDentist = dentists.find((d) => d.userId === activeUser.id) || dentists[0];

  const mySchedules = schedules
    .filter((s) => s.dentistId === currentDentist.id)
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek);

  const todayBlocked = blockedSchedules.find((b) => {
    if (b.dentistId && b.dentistId !== currentDentist.id) return false;
    if (!b.isAllDay && b.date !== today) return false;
    if (b.isAllDay) {
      const blockDate = b.date;
      return blockDate === today;
    }
    return b.date === today;
  });

  const getStatusForDay = (dayOfWeek: number): { active: boolean; label: string; color: string } => {
    const schedule = mySchedules.find((s) => s.dayOfWeek === dayOfWeek && s.active);
    if (!schedule) {
      return { active: false, label: 'Off', color: 'bg-slate-200 text-slate-500' };
    }
    return {
      active: true,
      label: `${schedule.startTime} - ${schedule.endTime}`,
      color: 'bg-emerald-100 text-emerald-700'
    };
  };

  return (
    <div className="space-y-6">
      <div className="neo-raised p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl neo-raised overflow-hidden shrink-0 bg-blue-100 flex items-center justify-center">
            {currentDentist.avatarUrl ? (
              <img src={currentDentist.avatarUrl} alt={currentDentist.fullName} className="w-full h-full object-cover" />
            ) : (
              <Clock className="w-7 h-7 text-blue-600" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-800">{currentDentist.fullName}</h2>
              <NeoBadge variant="primary">{currentDentist.specialization}</NeoBadge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              License: {currentDentist.licenseReference} • Clinic: {settings.clinicName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onNavigateToOperatory && (
            <NeoButton
              variant="default"
              onClick={onNavigateToOperatory}
              icon={<Stethoscope className="w-4 h-4" />}
            >
              Back to Operatory
            </NeoButton>
          )}
        </div>
      </div>

      {todayBlocked && (
        <NeoCard className="p-4 border-2 border-amber-500/40 bg-amber-50/50">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-800">Clinic Closure / Block Today</h4>
              <p className="text-xs text-amber-700 mt-0.5">{todayBlocked.reason}</p>
              <p className="text-[10px] text-amber-600 font-semibold mt-1">
                {todayBlocked.isAllDay ? 'Full day blocked' : `${todayBlocked.startTime} - ${todayBlocked.endTime}`}
              </p>
            </div>
          </div>
        </NeoCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <NeoCard className="p-0 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-300/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-800">Weekly Clinic Hours</h3>
              </div>
              <span className="text-xs text-slate-500">Recurring schedule</span>
            </div>

            {mySchedules.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                No clinic hours configured. Contact administration to set up your schedule.
              </div>
            ) : (
              <div className="divide-y divide-slate-300/30">
                {mySchedules.map((sch) => (
                  <div key={sch.id} className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-100/50 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 text-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">{DAY_SHORT[sch.dayOfWeek]}</span>
                        <span className="text-xs font-bold text-slate-700">{DAY_NAMES[sch.dayOfWeek]}</span>
                      </div>
                      <div className="h-8 w-px bg-slate-300/60" />
                      <div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span className="text-sm font-bold text-slate-800">
                            {sch.startTime} - {sch.endTime}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Coffee className="w-3.5 h-3.5 text-amber-600" />
                          <span className="text-xs text-slate-500">
                            Break: {sch.breakStart} - {sch.breakEnd}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${sch.active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {sch.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </NeoCard>
        </div>

        <div className="space-y-6">
          <NeoCard className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-800">Today's Status</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Date</span>
                <span className="font-bold text-slate-800">{today}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Day</span>
                <span className="font-bold text-slate-800">{DAY_NAMES[new Date().getDay()]}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Working Today</span>
                <span className={`font-bold ${getStatusForDay(new Date().getDay()).active ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {getStatusForDay(new Date().getDay()).active ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Hours</span>
                <span className="font-bold text-slate-800">
                  {getStatusForDay(new Date().getDay()).active ? getStatusForDay(new Date().getDay()).label : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Blocked</span>
                <span className={`font-bold ${todayBlocked ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {todayBlocked ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </NeoCard>

          <NeoCard className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-800">Operatory Info</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Chair</span>
                <span className="font-bold text-slate-800">Operatory Chair 1</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Location</span>
                <span className="font-bold text-slate-800">{settings.clinicName}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Status</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-emerald-700">Available</span>
                </span>
              </div>
            </div>
          </NeoCard>
        </div>
      </div>
    </div>
  );
};
