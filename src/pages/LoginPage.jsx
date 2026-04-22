import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import ErrorMessage from '../components/ErrorMessage';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.users.getAll({ email: formData.email });
      if (response.success && response.data?.length > 0) {
        const user = response.data[0];
        localStorage.setItem('user_token', user.id);
        navigate('/admin');
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="flex justify-center mb-6">
          <LogIn className="w-16 h-16 text-primary" />
        </div>
        <h2 className="text-3xl font-bold text-center mb-8">Login</h2>
        
        {error && <ErrorMessage message={error} />}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Email *</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password *</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
          </div>

          <button type="submit" disabled={loading} className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primaryDark transition-colors disabled:bg-gray-400">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600">
          Don't have an account? <Link to="/signup" className="text-primary font-semibold hover:underline">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}