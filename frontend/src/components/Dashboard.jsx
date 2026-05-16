import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import { Plus, Search, LogOut, FileText, Clock, AlertCircle, Users } from 'lucide-react';

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [dueDateFilter, setDueDateFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchTasks();
    
    // Socket.io connection
    const socket = io('http://localhost:5000');
    
    socket.on('taskCreated', (task) => {
      fetchTasks(); // simplistic approach: refetch
    });
    
    socket.on('taskUpdated', (task) => {
      fetchTasks();
    });
    
    socket.on('taskDeleted', (taskId) => {
      fetchTasks();
    });

    return () => socket.disconnect();
  }, [user, navigate, search, status, priority, dueDateFilter, sortBy, order, page]);

  const fetchTasks = async () => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };
      const { data } = await axios.get(`/api/tasks?search=${search}&status=${status}&priority=${priority}&dueDate=${dueDateFilter}&sortBy=${sortBy}&order=${order}&page=${page}`, config);
      setTasks(data.tasks);
      setTotalPages(data.pages);
    } catch (error) {
      console.error('Error fetching tasks', error);
    }
  };

  const getStatusColor = (s) => {
    switch(s) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getPriorityColor = (p) => {
    switch(p) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-green-600 bg-green-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">TaskFlow</h1>
          </div>
          <div className="flex items-center space-x-6">
            <span className="text-sm font-medium text-gray-600">
              Welcome, <span className="text-blue-600">{user?.username}</span>
            </span>
            {user?.role === 'admin' && (
              <button
                onClick={() => navigate('/users')}
                className="flex items-center text-gray-500 hover:text-purple-600 transition-colors"
              >
                <Users className="w-5 h-5 mr-1" />
                <span className="text-sm font-medium">Manage Users</span>
              </button>
            )}
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="flex items-center text-gray-500 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-1" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="relative w-full md:w-64">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-full transition-all shadow-sm"
              />
            </div>
            <button
              onClick={() => navigate('/task/new')}
              className="flex items-center bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg font-medium w-full md:w-auto justify-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Task
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none shadow-sm bg-white text-sm">
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none shadow-sm bg-white text-sm">
              <option value="">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select value={dueDateFilter} onChange={(e) => setDueDateFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none shadow-sm bg-white text-sm">
              <option value="">Any Due Date</option>
              <option value="today">Today</option>
              <option value="upcoming">Upcoming</option>
              <option value="overdue">Overdue</option>
            </select>

            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none shadow-sm bg-white text-sm">
              <option value="createdAt">Sort: Created</option>
              <option value="dueDate">Sort: Due Date</option>
              <option value="priority">Sort: Priority</option>
              <option value="status">Sort: Status</option>
            </select>
          </div>
        </div>

        {/* Task Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map(task => (
            <Link to={`/task/${task._id}`} key={task._id} className="block group">
              <div className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 p-6 h-full flex flex-col transform group-hover:-translate-y-1">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">{task.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 flex-grow line-clamp-3">
                  {task.description || "No description provided."}
                </p>
                
                {user?.role === 'admin' && task.assignedUser && (
                  <div className="mb-3 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded inline-block border border-gray-100 w-fit">
                    Assigned to: <span className="font-medium text-gray-900">{task.assignedUser.username}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
                  <div className="flex items-center text-sm">
                    <Clock className="w-4 h-4 mr-1 text-gray-400" />
                    <span className="text-gray-500">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                    </span>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
          {tasks.length === 0 && (
            <div className="col-span-full py-12 flex flex-col items-center justify-center bg-white rounded-xl border border-dashed border-gray-300">
              <AlertCircle className="w-12 h-12 text-gray-400 mb-3" />
              <p className="text-gray-500 text-lg">No tasks found. Create one to get started!</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-10 space-x-2">
            {[...Array(totalPages).keys()].map(x => (
              <button
                key={x + 1}
                onClick={() => setPage(x + 1)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${page === x + 1 ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
              >
                {x + 1}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
