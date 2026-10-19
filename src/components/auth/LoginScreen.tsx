import React, { useState } from 'react';
import { User, Lock, Mail, ShieldCheck, AlertCircle, ChevronRight } from 'lucide-react';
import { NeoCard } from '../common/NeoCard';
import { NeoInput } from '../common/NeoInput';
import { NeoButton } from '../common/NeoButton';
import type { User as UserType } from '../../types';

interface LoginScreenProps {
  onLogin: (email: string, password: string) => Promise<UserType>;
  onLoading: (loading: boolean) => void;
  authError?: string | null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onLoading,
  authError,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSubmitting(true);
    onLoading(true);
    try {
      await onLogin(email, password);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Invalid email or password. Please try again.';
      setLocalError(message);
    } finally {
      setSubmitting(false);
      onLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E8EEF5] text-slate-800 font-sans antialiased px-4 sm:px-6 lg:px-8">
      <NeoCard
        className="w-full max-w-md p-8 sm:p-10 shadow-2xl border border-slate-200/50"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl neo-raised flex items-center justify-center bg-blue-600 text-white mb-4 shrink-0">
            <User className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">DentCare</h1>
          <p className="text-sm text-slate-500 mt-1">Dental Clinic Platform — Sign in</p>
        </div>

        {authError || localError ? (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{authError || localError}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <NeoInput
            label="Email"
            icon={<Mail className="w-4 h-4" />}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <NeoInput
            label="Password"
            icon={<Lock className="w-4 h-4" />}
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <NeoButton
            type="submit"
            variant="primary"
            size="lg"
            disabled={submitting || !email || !password}
            className="w-full"
          >
            {submitting ? (
              <>
                <ChevronRight className="w-4 h-4 animate-spin" /> Signing in...
              </>
            ) : (
              <>Sign in</>
            )}
          </NeoButton>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-500 mb-3">
            Seeded accounts: admin@dentcare.com / reception@dentcare.com /
            dr.smith@dentcare.com / patient@dentcare.com
          </p>
          <ShieldCheck className="w-4 h-4 text-slate-400 mx-auto mb-2" />
          <p className="text-[10px] text-slate-400 uppercase tracking-wider">
            Role is server-authorized on sign-in
          </p>
        </div>
      </NeoCard>
    </div>
  );
};
