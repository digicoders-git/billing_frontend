import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Lock, RefreshCw } from 'lucide-react';
import api from '../lib/axios';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { username, password } = formData;
      const response = await api.post('/users/login', { username, password });
      
      const { token, ...userData } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('currentUser', JSON.stringify(userData));
      
      // Navigate based on role or default to dashboard
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      alert(error.response?.data?.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo in Form */}
          <div className="text-center mb-8">
            <div className="mb-4">
              <img 
                src="/Logo.png" 
                alt="BillSoft Logo" 
                className="w-30 h-30 mx-auto object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Login</h1>
            {/* <p className="text-gray-600 mt-1">Sign in to continue</p> */}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#000000] focus:border-transparent transition-all"
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#000000] focus:border-transparent transition-all"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-[#000000] text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-lg flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-xl cursor-pointer'}`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="animate-spin" size={18} />
                  Singing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default Login;