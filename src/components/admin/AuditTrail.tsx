import React, { useState } from 'react';
import { Download, Search, Filter } from 'lucide-react';
import { NeoCard } from '../common/NeoCard';
import { NeoButton } from '../common/NeoButton';
import { NeoInput } from '../common/NeoInput';
import { NeoSelect } from '../common/NeoSelect';
import { AuditLog } from '../../types';

interface AuditTrailProps {
  auditLogs: AuditLog[];
  onExportCSV: () => void;
}

export const AuditTrail: React.FC<AuditTrailProps> = ({ auditLogs, onExportCSV }) => {
  const [auditSearch, setAuditSearch] = useState<string>('');
  const [auditActionFilter, setAuditActionFilter] = useState<string>('all');

  const filteredLogs = auditLogs.filter((log) => {
    if (auditActionFilter !== 'all' && log.action !== auditActionFilter) return false;
    if (!auditSearch.trim()) return true;
    const q = auditSearch.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.actorName.toLowerCase().includes(q) ||
      log.entityType.toLowerCase().includes(q) ||
      JSON.stringify(log.details).toLowerCase().includes(q)
    );
  });

  return (
    <NeoCard className="overflow-hidden">
      <div className="border-b border-slate-300/40 pb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Immutable Audit Trail</h3>
          <p className="text-xs text-slate-500">Every state change, reschedule, cancellation, no-show, and payment is permanently timestamped.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap select-none font-medium px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100/80 text-blue-700 border border-blue-200/60 shadow-xs">
          <span>{filteredLogs.length} Events</span>
        </span>
      </div>

      <div className="p-4 sm:p-5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <NeoInput
            placeholder="Search actor, action, or details..."
            value={auditSearch}
            onChange={(e) => setAuditSearch(e.target.value)}
            icon={<Search className="w-4 h-4 text-slate-400" />}
          />
          <NeoSelect
            value={auditActionFilter}
            onChange={(e) => setAuditActionFilter(e.target.value)}
          >
            <option value="all">All Actions</option>
            <option value="APPOINTMENT_REQUESTED">APPOINTMENT_REQUESTED</option>
            <option value="STATUS_CHANGED">STATUS_CHANGED</option>
            <option value="APPOINTMENT_RESCHEDULED">APPOINTMENT_RESCHEDULED</option>
            <option value="APPOINTMENT_CANCELLED">APPOINTMENT_CANCELLED</option>
            <option value="NO_SHOW_RECORDED">NO_SHOW_RECORDED</option>
            <option value="EMERGENCY_OVERRIDE">EMERGENCY_OVERRIDE</option>
            <option value="CONSULTATION_SAVED">CONSULTATION_SAVED</option>
            <option value="PAYMENT_PROCESSED">PAYMENT_PROCESSED</option>
            <option value="WAITLIST_ENROLLED">WAITLIST_ENROLLED</option>
          </NeoSelect>
        </div>
      </div>

      <div className="max-h-[500px] overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 bg-[#E8EEF5] border-b border-slate-300/40 z-10 text-[10px] uppercase font-bold text-slate-500">
            <tr>
              <th className="p-3 pl-5">Timestamp</th>
              <th className="p-3">Actor & Role</th>
              <th className="p-3">Action</th>
              <th className="p-3">Entity</th>
              <th className="p-3 pr-5">Event Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300/30 text-slate-700">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-100/50">
                <td className="p-3 pl-5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="p-3">
                  <span className="font-bold text-slate-800 block">{log.actorName}</span>
                  <span className="text-[10px] text-slate-500 uppercase">{log.actorRole}</span>
                </td>
                <td className="p-3">
                  <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                    {log.action}
                  </span>
                </td>
                <td className="p-3 font-semibold text-slate-600">
                  {log.entityType} ({log.entityId.slice(0, 8)})
                </td>
                <td className="p-3 pr-5 text-slate-600 font-mono text-[11px] max-w-xs truncate">
                  {JSON.stringify(log.details)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </NeoCard>
  );
};
