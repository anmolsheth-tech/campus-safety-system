import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, Hash, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input } from '@/components/ui';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    student_id: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.full_name.trim()) newErrors.full_name = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!formData.email.includes('@')) newErrors.email = 'Valid email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Minimum 6 characters';
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      await register(
        formData.email,
        formData.password,
        formData.full_name,
        formData.phone || undefined,
        formData.student_id || undefined
      );
      toast.success('Account registered successfully!');
      navigate('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const update = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Create Safety Profile
        </h2>
        <p className="text-xs text-slate-500 font-normal">
          Register to receive instant emergency updates and AI hazard routing
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 pt-1">
        <Input
          label="Full Legal Name"
          placeholder="Jane Doe"
          value={formData.full_name}
          onChange={(e) => update('full_name', e.target.value)}
          error={errors.full_name}
          icon={<User className="w-4 h-4 text-slate-400" />}
          required
        />

        <Input
          label="University Email"
          type="email"
          placeholder="student@campus.edu"
          value={formData.email}
          onChange={(e) => update('email', e.target.value)}
          error={errors.email}
          icon={<Mail className="w-4 h-4 text-slate-400" />}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Phone (Emergency)"
            type="tel"
            placeholder="+1 555-0192"
            value={formData.phone}
            onChange={(e) => update('phone', e.target.value)}
            icon={<Phone className="w-4 h-4 text-slate-400" />}
          />
          <Input
            label="Student / Staff ID"
            placeholder="STU-9921"
            value={formData.student_id}
            onChange={(e) => update('student_id', e.target.value)}
            icon={<Hash className="w-4 h-4 text-slate-400" />}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Password"
            type="password"
            placeholder="Min. 6 chars"
            value={formData.password}
            onChange={(e) => update('password', e.target.value)}
            error={errors.password}
            icon={<Lock className="w-4 h-4 text-slate-400" />}
            required
          />
          <Input
            label="Confirm"
            type="password"
            placeholder="Re-enter"
            value={formData.confirmPassword}
            onChange={(e) => update('confirmPassword', e.target.value)}
            error={errors.confirmPassword}
            icon={<Lock className="w-4 h-4 text-slate-400" />}
            required
          />
        </div>

        <Button
          type="submit"
          className="w-full font-bold shadow-md shadow-brand-600/20 mt-2"
          size="md"
          isLoading={isLoading}
          rightIcon={<ArrowRight className="w-4 h-4 ml-1" />}
        >
          Create Profile
        </Button>
      </form>

      <div className="text-center pt-2 border-t border-slate-100">
        <p className="text-xs text-slate-500 font-medium">
          Already registered?{' '}
          <Link
            to="/login"
            className="text-brand-600 hover:text-brand-700 font-bold underline-offset-2 hover:underline"
          >
            Sign In Here
          </Link>
        </p>
      </div>
    </div>
  );
}
