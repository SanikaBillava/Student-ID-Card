import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import FileUpload from '../components/FileUpload';
import ErrorMessage from '../components/ErrorMessage';
import { UserCircle2 } from 'lucide-react';

export default function SignupPage() {
  const [formData, setFormData] = useState({ name: '', email: '', mobile: '', password: '', school_logo: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogoUpload = (url) => {
    setFormData({ ...formData, school_logo: url });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.users.create(formData);
      if (response.success) {
        localStorage.setItem('user_token', response.data.id);
        navigate('/configuration');
      }
    } catch (err) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="flex justify-center mb-6">
          <UserCircle2 className="w-16 h-16 text-primary" />
        </div>
        <h2 className="text-3xl font-bold text-center mb-8">Create Account</h2>
        
        {error && <ErrorMessage message={error} />}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Name *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email *</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Mobile No. *</label>
            <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password *</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength="6" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">School Logo</label>
            <FileUpload onUploadSuccess={handleLogoUpload} accept="image/*" />
            {formData.school_logo && (
              <div className="mt-2">
                <img src={formData.school_logo} alt="School Logo" className="h-20 w-20 object-contain" />
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primaryDark transition-colors disabled:bg-gray-400">
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600">
          Already have an account? <Link to="/login" className="text-primary font-semibold hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}