import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeft, Save, User as UserIcon, Lock } from 'lucide-react';

const UserDetail = () => {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    if (!isNew) {
      fetchUser();
    }
  }, [id, user, navigate, isNew]);

  const fetchUser = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get(`/api/users/${id}`, config);
      setUsername(data.username);
      setRole(data.role);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching user');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const payload = { username, role };
      if (password) {
        payload.password = password;
      } else if (isNew) {
        setError('Password is required for new users');
        setLoading(false);
        return;
      }

      if (isNew) {
        await axios.post('/api/users', payload, config);
      } else {
        await axios.put(`/api/users/${id}`, payload, config);
      }
      navigate('/users');
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving user');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link to="/users" className="flex items-center text-gray-500 hover:text-purple-600 transition-colors w-fit">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to User Management
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-purple-600 px-8 py-6">
            <h2 className="text-2xl font-bold text-white">{isNew ? 'Create New User' : 'Edit User'}</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 rounded-r-lg">{error}</div>}
            
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-700">Username <span className="text-red-500">*</span></label>
              <div className="relative">
                <UserIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all shadow-sm"
                  required
                  placeholder="Enter username"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-700">
                Password {isNew && <span className="text-red-500">*</span>}
                {!isNew && <span className="text-xs text-gray-500 font-normal ml-2">(Leave blank to keep unchanged)</span>}
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all shadow-sm"
                  required={isNew}
                  placeholder={isNew ? "Enter secure password" : "Enter new password"}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-700">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none shadow-sm bg-white"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/users')}
                className="px-6 py-3 mr-4 rounded-lg font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-70"
              >
                <Save className="w-5 h-5 mr-2" />
                {loading ? 'Saving...' : 'Save User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserDetail;
