import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { NeoCard } from '../common/NeoCard';
import { NeoButton } from '../common/NeoButton';
import { NeoInput } from '../common/NeoInput';
import { SystemSettings } from '../../types';

interface ClinicSettingsProps {
  settings: SystemSettings;
  onSaveSettings: (settings: SystemSettings) => void;
}

export const ClinicSettings: React.FC<ClinicSettingsProps> = ({ settings, onSaveSettings }) => {
  const [settingsForm, setSettingsForm] = useState<SystemSettings>({ ...settings });
  const [settingsSaved, setSettingsSaved] = useState<boolean>(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(settingsForm);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  return (
    <NeoCard className="space-y-6">
      <div className="border-b border-slate-300/40 pb-3">
        <h3 className="text-sm font-bold text-slate-800">Clinic Operational Rules & Automation Buffers</h3>
        <p className="text-xs text-slate-500">Fine-tune reminder timings, no-show restriction thresholds, and emergency buffers.</p>
      </div>

      {settingsSaved && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Settings updated and active throughout the appointment system!
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NeoInput
            label="Clinic Legal Name"
            value={settingsForm.clinicName}
            onChange={(e) => setSettingsForm({ ...settingsForm, clinicName: e.target.value })}
          />
          <NeoInput
            label="Reception Phone Line"
            value={settingsForm.clinicPhone}
            onChange={(e) => setSettingsForm({ ...settingsForm, clinicPhone: e.target.value })}
          />
          <NeoInput
            label="Physical Address"
            value={settingsForm.clinicAddress}
            onChange={(e) => setSettingsForm({ ...settingsForm, clinicAddress: e.target.value })}
          />
          <NeoInput
            label="Notification Email"
            value={settingsForm.clinicEmail}
            onChange={(e) => setSettingsForm({ ...settingsForm, clinicEmail: e.target.value })}
          />
        </div>

        <div className="p-5 rounded-2xl neo-inset space-y-4">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Flowchart Automation Parameters
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <NeoInput
              label="Advance Reminder Lead Time (Hours)"
              type="number"
              value={settingsForm.reminderLeadHours}
              onChange={(e) => setSettingsForm({ ...settingsForm, reminderLeadHours: Number(e.target.value) })}
              helperText="Default: 24h SMS/Email reminder dispatch"
            />
            <NeoInput
              label="No-Show Policy Lock Threshold (Count)"
              type="number"
              value={settingsForm.maxNoShowsBeforeLock}
              onChange={(e) => setSettingsForm({ ...settingsForm, maxNoShowsBeforeLock: Number(e.target.value) })}
              helperText="Strikes before patient requires staff confirmation"
            />
            <NeoInput
              label="Emergency Buffer Auto-Shift (Minutes)"
              type="number"
              value={settingsForm.emergencyBufferShiftMinutes}
              onChange={(e) => setSettingsForm({ ...settingsForm, emergencyBufferShiftMinutes: Number(e.target.value) })}
              helperText="Time added to waiting patients during emergency"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <NeoButton type="submit" variant="primary">
            Save System Configuration
          </NeoButton>
        </div>
      </form>
    </NeoCard>
  );
};
