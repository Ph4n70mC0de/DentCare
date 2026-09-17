import React, { useState, useMemo } from 'react';
import { Search, Download, ShieldCheck, Users as UsersIcon, UserCheck, Stethoscope } from 'lucide-react';
import { NeoCard } from '../common/NeoCard';
import { NeoButton } from '../common/NeoButton';
import { NeoInput } from '../common/NeoInput';
import { NeoSelect } from '../common/NeoSelect';
import { NeoBadge } from '../common/NeoBadge';
import { User, UserRole } from '../../types';
import { useDentalStore } from '../../services/useDentalStore';

const ROLE_META: Record<UserRole, { label: string; variant: 'primary' | 'success' | 'warning' | 'neutral'; icon: React.ReactNode }> = {
  admin: { label: 'Admin', variant: 'primary', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  front_desk: { label: 'Front Desk', variant: 'success', icon: <UsersIcon className="w-3.5 h-3.5" /> },
  dentist: { label: 'Dentist', variant: 'warning', icon: <Stethoscope className="w-3.5 h-3.5" /> },
  patient: { label: 'Patient', variant: 'neutral', icon: <UserCheck className="w-3.5 h-3.5" /> }
};

interface UserDirectoryProps {}

export const UserDirectory: React.FC<UserDirectoryProps> = ({
}) => {
  const { users } = useDentalStore();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            u.fullName.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            u.phone.replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
            u.role.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .filter((u) => {
        if (roleFilter !== 'all' && u.role !== roleFilter) return false;
        if (statusFilter !== 'all' && u.status !== statusFilter) return false;
        return true;
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [users, searchQuery, roleFilter, statusFilter]);

  const totalCount = users.length;
  const activeCount = users.filter((u) => u.status === 'active').length;
  const roleCounts = useMemo(() => {
    const counts: Record<UserRole, number> = { admin: 0, front_desk: 0, dentist: 0, patient: 0 };
    users.forEach((u) => { counts[u.role]++; });
    return counts;
  }, [users]);

  const exportUsersCSV = () => {
    const headers = ['Name', 'Role', 'Email', 'Phone', 'Status', 'Created'];
    const rows = filteredUsers.map((u) => [
      u.fullName,
      ROLE_META[u.role]?.label || u.role,
      u.email,
      u.phone,
      u.status,
      new Date(u.createdAt).toISOString()
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DentCare-UserDirectory-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <NeoCard className="space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Users</span>
          <span className="text-xl font-black text-slate-800">{totalCount}</span>
          <span className="text-[10px] text-slate-500">{activeCount} active</span>
        </NeoCard>
        <NeoCard className="space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Admins</span>
          <span className="text-xl font-black text-blue-700">{roleCounts.admin}</span>
        </NeoCard>
        <NeoCard className="space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Front Desk</span>
          <span className="text-xl font-black text-emerald-700">{roleCounts.front_desk}</span>
        </NeoCard>
        <NeoCard className="space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Dentists</span>
          <span className="text-xl font-black text-amber-700">{roleCounts.dentist}</span>
        </NeoCard>
        <NeoCard className="space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Patients</span>
          <span className="text-xl font-black text-slate-700">{roleCounts.patient}</span>
        </NeoCard>
      </div>

      {/* Filters */}
      <NeoCard className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700">Users</h3>
          <NeoButton variant="default" size="sm" onClick={exportUsersCSV} icon={<Download className="w-4 h-4" />}>
            Export CSV
          </NeoButton>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <NeoInput
            placeholder="Search by name, email, phone, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4 text-slate-400" />}
          />
          <NeoSelect
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="front_desk">Front Desk</option>
            <option value="dentist">Dentist</option>
            <option value="patient">Patient</option>
          </NeoSelect>
          <NeoSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </NeoSelect>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-[#E8EEF5] border-b border-slate-300/40 z-10 text-[10px] uppercase font-bold text-slate-500">
              <tr>
                <th className="p-3 pl-5">Name</th>
                <th className="p-3">Role</th>
                <th className="p-3">Email</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Status</th>
                <th className="p-3 pr-5">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300/30 text-slate-700">
              {filteredUsers.map((u) => {
                const meta = ROLE_META[u.role];
                return (
                  <tr key={u.id} className="hover:bg-slate-100/50">
                    <td className="p-3 pl-5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full neo-raised bg-[#E8EEF5] flex items-center justify-center text-[10px] font-bold text-slate-700">
                          {u.fullName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>
                        <span className="font-bold text-slate-800">{u.fullName}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        u.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                        u.role === 'dentist' ? 'bg-amber-100 text-amber-800' :
                        u.role === 'front_desk' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {meta.icon}
                        {meta.label}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-600">{u.email}</td>
                    <td className="p-3 font-mono text-[11px] text-slate-600">{u.phone}</td>
                    <td className="p-3">
                      <NeoBadge variant={u.status === 'active' ? 'success' : 'neutral'} size="sm">
                        {u.status}
                      </NeoBadge>
                    </td>
                    <td className="p-3 pr-5 text-[11px] text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </NeoCard>
    </div>
  );
};
