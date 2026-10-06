import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input } from '@/components/ui';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in your credentials');
      return;
    }
    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('Authenticated successfully');
      navigate('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      toast.error(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = async (role: string) => {
    setIsLoading(true);
    const accounts: Record<string, { email: string; pass: string }> = {
      student: { email: 'student@demo.com', pass: 'password123' },
      admin: { email: 'admin@demo.com', pass: 'password123' },
      security: { email: 'security@demo.com', pass: 'password123' },
    };

    const target = accounts[role] || accounts.student;
    setEmail(target.email);
    setPassword(target.pass);

    try {
      await login(target.email, target.pass);
      toast.success(`Authenticated as ${role.toUpperCase()}`);
      navigate('/dashboard');
    } catch {
      // Fallback try alternate email
      try {
        await login(`demo.${role}@campus.edu`, 'demo1234');
        toast.success(`Authenticated as ${role.toUpperCase()}`);
        navigate('/dashboard');
      } catch {
        toast.error('Demo account unavailable - register a new account or sign in with custom credentials');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Sign In to Portal
        </h2>
        <p className="text-xs text-slate-500 font-normal">
          Enter your university credentials to access safety controls
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        <Input
          label="Campus Email"
          type="email"
          placeholder="student@demo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail className="w-4 h-4 text-slate-400" />}
          required
        />

        <div className="relative">
          <Input
            label="Security Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="w-4 h-4 text-slate-400" />}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-[38px] text-slate-400 hover:text-slate-600 focus:outline-none"
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <Button
          type="submit"
          className="w-full font-bold shadow-md shadow-brand-600/20 mt-2"
          size="md"
          isLoading={isLoading}
          rightIcon={<ArrowRight className="w-4 h-4 ml-1" />}
        >
          Sign In
        </Button>
      </form>

      {/* Quick Demo Selector */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            1-Click Demo Profiles
          </span>
          <span className="text-[10px] text-brand-600 font-semibold bg-brand-50 px-2 py-0.5 rounded-full">
            Instant Access
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => demoLogin('student')}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-brand-200/80 bg-brand-50/50 hover:bg-brand-100/60 transition-all text-left group"
          >
            <span className="block text-xs font-bold text-brand-700 group-hover:text-brand-800">
              Student
            </span>
            <span className="block text-[10px] text-brand-600/80">Default User</span>
          </button>

          <button
            type="button"
            onClick={() => demoLogin('admin')}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-purple-200/80 bg-purple-50/50 hover:bg-purple-100/60 transition-all text-left group"
          >
            <span className="block text-xs font-bold text-purple-700 group-hover:text-purple-800">
              Admin
            </span>
            <span className="block text-[10px] text-purple-600/80">Full Control</span>
          </button>

          <button
            type="button"
            onClick={() => demoLogin('security')}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-amber-200/80 bg-amber-50/50 hover:bg-amber-100/60 transition-all text-left group"
          >
            <span className="block text-xs font-bold text-amber-700 group-hover:text-amber-800">
              Security
            </span>
            <span className="block text-[10px] text-amber-600/80">Patrol Ops</span>
          </button>
        </div>
      </div>

      <div className="text-center pt-2">
        <p className="text-xs text-slate-500 font-medium">
          New to CampusSafe?{' '}
          <Link
            to="/register"
            className="text-brand-600 hover:text-brand-700 font-bold underline-offset-2 hover:underline"
          >
            Create an Account
          </Link>
        </p>
      </div>
    </div>
  );
}
