// src/pages/Login/index.jsx
import React, { useState } from 'react';
import { Mail, Lock, LogIn, Clock } from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const Login = () => {
  const { login } = useAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      console.error('Login error:', err);
      let message = 'Đăng nhập thất bại';
      if (err.code === 'auth/invalid-credential') {
        message = 'Email hoặc mật khẩu không đúng';
      } else if (err.code === 'auth/user-not-found') {
        message = 'Tài khoản không tồn tại';
      } else if (err.code === 'auth/wrong-password') {
        message = 'Mật khẩu không đúng';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Clock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Chấm công GPS & QR</h1>
          <p className="text-gray-500 mt-2">Đăng nhập để tiếp tục</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            icon={Mail}
            required
          />

          <Input
            label="Mật khẩu"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            icon={Lock}
            required
          />

          <Button
            type="submit"
            fullWidth
            loading={loading}
            className="mt-6"
          >
            <LogIn className="w-5 h-5 mr-2" />
            Đăng nhập
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Hệ thống quản lý chấm công v2.0</p>
          <p className="mt-1">© 2025 - GPS & QR Code Attendance</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
