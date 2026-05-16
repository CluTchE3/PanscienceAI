import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeft, Save, Trash2, Upload, File as FileIcon, Download, AlertCircle, X } from 'lucide-react';

const TaskDetail = () => {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('pending');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [assignedUser, setAssignedUser] = useState('');
  const [usersList, setUsersList] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role === 'admin') {
      fetchUsersList();
      if (isNew) {
        setAssignedUser('');
      }
    }
    if (!isNew) {
      fetchTask();
    }
  }, [id, user, navigate, isNew]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchUsersList = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get('/api/users', config);
      setUsersList(data.filter(u => u._id !== user._id));
    } catch (err) {
      console.error('Error fetching users', err);
    }
  };

  const fetchTask = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get(`/api/tasks/${id}`, config);
      setTitle(data.title);
      setDescription(data.description || '');
      setStatus(data.status);
      setPriority(data.priority);
      if (data.dueDate) {
        setDueDate(new Date(data.dueDate).toISOString().split('T')[0]);
      }
      if (data.assignedUser) {
        setAssignedUser(data.assignedUser._id || data.assignedUser);
      }
      setExistingAttachments(data.attachments || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching task');
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + existingAttachments.length > 3) {
      setError('You can only upload a maximum of 3 PDFs per task.');
      return;
    }
    const invalidFile = files.find(f => f.type !== 'application/pdf');
    if (invalidFile) {
      setError('Only PDF files are allowed.');
      return;
    }
    setError('');
    setNewFiles(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('status', status);
      formData.append('priority', priority);
      if (dueDate) formData.append('dueDate', dueDate);
      if (user.role === 'admin' && assignedUser) formData.append('assignedUser', assignedUser);
      if (!isNew) formData.append('existingAttachments', JSON.stringify(existingAttachments));
      
      newFiles.forEach(file => {
        formData.append('attachments', file);
      });

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${user.token}`
        }
      };

      if (isNew) {
        await axios.post('/api/tasks', formData, config);
      } else {
        await axios.put(`/api/tasks/${id}`, formData, config);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving task');
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        await axios.delete(`/api/tasks/${id}`, config);
        navigate('/');
      } catch (err) {
        setError(err.response?.data?.message || 'Error deleting task');
      }
    }
  };

  return (
    <>
      {error && (
        <div className="fixed bottom-6 right-6 z-50 bg-white border-l-4 border-red-500 p-4 rounded-lg shadow-2xl flex items-start space-x-3 max-w-sm transition-all duration-300 transform translate-y-0 opacity-100">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-gray-900">Notification</h4>
            <p className="text-sm text-gray-600 mt-1">{error}</p>
          </div>
          <button type="button" onClick={() => setError('')} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="flex items-center text-gray-500 hover:text-blue-600 transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Link>
          {!isNew && (
            <button
              onClick={handleDelete}
              className="flex items-center text-red-500 hover:text-red-700 transition-colors bg-red-50 px-3 py-1.5 rounded-lg"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              Delete Task
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-blue-600 px-8 py-6">
            <h2 className="text-2xl font-bold text-white">{isNew ? 'Create New Task' : 'Edit Task Details'}</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-700">Task Title <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
                required
                placeholder="E.g., Complete quarterly report"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-700">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm resize-none"
                placeholder="Provide task details..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none shadow-sm bg-white"
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none shadow-sm bg-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                />
              </div>
            </div>

            {user?.role === 'admin' && (
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700">Assign To</label>
                <select
                  value={assignedUser}
                  onChange={(e) => setAssignedUser(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none shadow-sm bg-white"
                >
                  <option value="">Assign to yourself</option>
                  {usersList.map(u => (
                    <option key={u._id} value={u._id}>{u.username}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Attachments Section */}
            <div className="pt-6 border-t border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Upload className="w-5 h-5 mr-2 text-blue-500" />
                Attachments (PDFs only)
              </h3>
              
              {existingAttachments.length > 0 && (
                <div className="mb-4 space-y-2">
                  <p className="text-sm text-gray-500 mb-2">Existing Files:</p>
                  {existingAttachments.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <div className="flex items-center text-sm text-gray-700 truncate mr-4">
                        <FileIcon className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{file.filename}</span>
                      </div>
                      <div className="flex items-center">
                        <a
                          href={`http://localhost:5000/${file.path}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium whitespace-nowrap"
                        >
                          <Download className="w-4 h-4 mr-1" /> View/Download
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...existingAttachments];
                            updated.splice(idx, 1);
                            setExistingAttachments(updated);
                          }}
                          className="text-red-500 hover:text-red-700 ml-4 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Remove file"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4">
                <label 
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                  onClick={(e) => {
                    if (existingAttachments.length + newFiles.length >= 3) {
                      e.preventDefault();
                      setError('You can only upload a maximum of 3 PDFs per task.');
                    }
                  }}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-gray-500">PDF up to 10MB (Max 3 total)</p>
                  </div>
                  <input 
                    type="file" 
                    multiple 
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="hidden" 
                  />
                </label>
                
                {newFiles.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700">Files to upload:</p>
                    <ul className="text-sm text-gray-600 list-disc pl-5 mt-1">
                      {newFiles.map((f, i) => <li key={i}>{f.name}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-6 py-3 mr-4 rounded-lg font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-70"
              >
                <Save className="w-5 h-5 mr-2" />
                {loading ? 'Saving...' : 'Save Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    </>
  );
};

export default TaskDetail;
