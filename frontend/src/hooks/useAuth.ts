import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services';

export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const user = await authService.getMe();
          store.setUser(user);
        } catch {
          store.logout();
        }
      }
      store.setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    store.setAuth(response.user, response.access_token);
    return response;
  };

  const register = async (email: string, password: string, fullName: string, phone?: string, studentId?: string) => {
    await authService.register({
      email,
      password,
      full_name: fullName,
      phone,
      student_id: studentId,
    });
    return login(email, password);
  };


  const logout = () => {
    store.logout();
  };

  return {
    ...store,
    login,
    register,
    logout,
  };
}
