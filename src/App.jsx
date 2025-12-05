import React, { useState, useEffect, useMemo } from 'react';
// ⚠️ NOTE: To use this in your local project:
// 1. Run: npm install @supabase/supabase-js
// 2. Uncomment the import below:
// import { createClient } from '@supabase/supabase-js';
// ... existing imports
import { supabase } from './supabaseClient'

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { 
  LayoutDashboard, LogOut, Calendar, Package, AlertCircle, CheckCircle, Clock, Bell, Loader2, XCircle, Users, Filter
} from 'lucide-react';

// ==========================================
// 🚀 SUPABASE CONFIGURATION
// ==========================================
// const SUPABASE_URL = ''; 
// const SUPABASE_ANON_KEY = '';

// const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY) 
//   ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
//   : null;

// ==========================================
// 🧪 MOCK DATA (FALLBACK)
// ==========================================
const MOCK_DATA = [
  { id: 21, subscriber_name: 'little_toes_baheer', order_id: '7496366882903', phone: '201114344604', status: 'ESCALATED', created_at: '2025-11-28T10:26:51.059Z' },
  { id: 25, subscriber_name: 'little_toes_baheer', order_id: '7497019916375', phone: '201001030020', status: 'CONFIRMED', created_at: '2025-11-28T14:35:11.896Z' },
  { id: 32, subscriber_name: 'little_toes_baheer', order_id: '7499213111383', phone: '201223130974', status: 'REMINDED', created_at: '2025-11-28T20:45:44.866Z' },
  { id: 35, subscriber_name: 'netaq_aljamal', order_id: '6208391577782', phone: '201111035622', status: 'PENDING', created_at: '2025-11-28T21:45:00.000Z' },
  { id: 36, subscriber_name: 'little_toes_baheer', order_id: '7499213111999', phone: '201223130999', status: 'PENDING', created_at: new Date().toISOString() },
  { id: 37, subscriber_name: 'different_store', order_id: '7499213555555', phone: '201005555555', status: 'CANCELLED', created_at: new Date().toISOString() },
];

// --- UI COMPONENTS ---

const Card = ({ title, value, icon: Icon, colorClass }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between transition-transform hover:scale-[1.02]">
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
    </div>
    <div className={`p-3 rounded-lg ${colorClass}`}>
      <Icon size={24} />
    </div>
  </div>
);

const Login = ({ onLogin, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md border border-slate-100">
        <div className="flex justify-center mb-6">
          <div className="bg-indigo-600 p-3 rounded-xl shadow-indigo-200 shadow-lg">
            <LayoutDashboard className="text-white" size={32} />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">Welcome Back</h2>
        <p className="text-center text-slate-500 mb-8">Login to view your order insights</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="e.g. subscriber_name or admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2 animate-pulse">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors shadow-md hover:shadow-lg transform active:scale-[0.98]"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

const Dashboard = ({ user, onLogout }) => {
  const isAdmin = user === 'admin';
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  
  // Filters State
  const [subscriberFilter, setSubscriberFilter] = useState('All');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
    end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] 
  });

  // 1. Fetch Data
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setFetchError('');

      try {
        let allData = [];
        
        if (supabase) {
          const PAGE_SIZE = 1000;
          let page = 0;
          let hasMore = true;

          while (hasMore) {
            let query = supabase
              .from('Orders')
              .select('*')
              .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
            
            // IF NOT ADMIN, FILTER BY SUBSCRIBER NAME
            if (!isAdmin) {
              query = query.eq('subscriber_name', user);
            }

            const { data: batch, error } = await query;

            if (error) throw error;

            if (batch.length > 0) {
              allData = [...allData, ...batch];
              if (batch.length < PAGE_SIZE) hasMore = false;
              else page++;
            } else {
              hasMore = false;
            }
          }

        } else {
          // --- MOCK MODE ---
          console.warn("Using Mock Data");
          await new Promise(resolve => setTimeout(resolve, 800));
          if (isAdmin) {
             allData = MOCK_DATA; // Admin sees all
          } else {
             allData = MOCK_DATA.filter(o => o.subscriber_name === user); // User sees theirs
          }
        }

        setOrders(allData);
      } catch (err) {
        console.error("Fetch error:", err);
        setFetchError('Failed to load orders.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOrders();
    }
  }, [user, isAdmin]);

  // 2. Derive Unique Subscribers for Filter Dropdown (Admin Only)
  const uniqueSubscribers = useMemo(() => {
    if (!isAdmin) return [];
    const names = orders.map(o => o.subscriber_name);
    return [...new Set(names)].sort();
  }, [orders, isAdmin]);

  // 3. Filter Data in Memory
    const filteredData = useMemo(() => {
      // FIX: Append time to force Local Timezone parsing
      // This fixes the issue where orders between 00:00 and 02:00 (Cairo) were hidden
      const start = new Date(dateRange.start + 'T00:00:00');
      const end = new Date(dateRange.end + 'T23:59:59.999');

      return orders.filter(order => {
        // Date Filter
        const orderDate = new Date(order.created_at);
        const inDateRange = orderDate >= start && orderDate <= end;
        
        // Subscriber Filter (Admin Only)
        const matchesSubscriber = 
          !isAdmin || 
          subscriberFilter === 'All' || 
          order.subscriber_name === subscriberFilter;

        return inDateRange && matchesSubscriber;
      });
    }, [orders, dateRange, subscriberFilter, isAdmin]);

  // 4. Calculate Stats
  const stats = useMemo(() => {
    return filteredData.reduce((acc, curr) => {
      acc.total++;
      const status = curr.status ? curr.status.toUpperCase() : 'UNKNOWN';
      if (status === 'PENDING') acc.pending++;
      else if (status === 'ESCALATED') acc.escalated++;
      else if (status === 'CONFIRMED') acc.confirmed++;
      else if (status === 'REMINDED') acc.reminded++;
      else if (status === 'CANCELLED') acc.cancelled++;
      return acc;
    }, { total: 0, pending: 0, escalated: 0, confirmed: 0, reminded: 0, cancelled: 0 });
  }, [filteredData]);

  // 5. Chart Data
  const chartData = [
    { name: 'Pending', value: stats.pending, color: '#f59e0b' },
    { name: 'Escalated', value: stats.escalated, color: '#ef4444' },
    { name: 'Confirmed', value: stats.confirmed, color: '#22c55e' },
    { name: 'Reminded', value: stats.reminded, color: '#3b82f6' },
    { name: 'Cancelled', value: stats.cancelled, color: '#64748b' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 flex-col gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
        <p className="text-slate-500 font-medium">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Top Navigation */}
      <nav className={`${isAdmin ? 'bg-slate-800' : 'bg-white'} border-b border-slate-200 px-4 md:px-8 py-4 flex justify-between items-center sticky top-0 z-20 shadow-sm transition-colors`}>
        <div className="flex items-center gap-3">
          <div className={`${isAdmin ? 'bg-indigo-500' : 'bg-indigo-600'} p-2 rounded-lg shadow-md`}>
            {isAdmin ? <Users className="text-white" size={20} /> : <LayoutDashboard className="text-white" size={20} />}
          </div>
          <div>
            <h1 className={`font-bold ${isAdmin ? 'text-white' : 'text-slate-800'} text-lg md:text-xl leading-tight`}>
              {isAdmin ? 'Admin Master View' : 'Orders Dashboard'}
            </h1>
            <p className={`text-xs ${isAdmin ? 'text-slate-400' : 'text-slate-500'}`}>
              User: <span className="font-semibold text-indigo-400">{user}</span>
            </p>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium border border-transparent
            ${isAdmin 
              ? 'text-slate-300 hover:text-white hover:bg-slate-700' 
              : 'text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-100'
            }`}
        >
          <LogOut size={18} />
          <span className="hidden md:inline">Logout</span>
        </button>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        
        {!supabase && (
          <div className="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
            <AlertCircle className="text-amber-600 mt-1 flex-shrink-0" size={20} />
            <div>
              <h4 className="font-bold text-amber-800 text-sm">Mock Mode</h4>
              <p className="text-amber-700 text-xs mt-1">Supabase keys missing.</p>
            </div>
          </div>
        )}

        {/* --- FILTERS BAR --- */}
        <div className="mb-8 bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row flex-wrap gap-4 items-start md:items-center justify-between">
          
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            {/* Date Filter */}
            <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 text-slate-700 px-2">
                <Calendar size={18} />
                <span className="font-semibold text-sm hidden lg:inline">Dates</span>
              </div>
              <input 
                type="date" 
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="px-2 py-1 border border-slate-300 rounded text-sm outline-none"
              />
              <span className="text-slate-400 font-medium">-</span>
              <input 
                type="date" 
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="px-2 py-1 border border-slate-300 rounded text-sm outline-none"
              />
            </div>

            {/* Subscriber Filter (ADMIN ONLY) */}
            {isAdmin && (
              <div className="flex items-center gap-3 bg-indigo-50 p-2 rounded-lg border border-indigo-100">
                <div className="flex items-center gap-2 text-indigo-700 px-2">
                  <Filter size={18} />
                  <span className="font-semibold text-sm hidden lg:inline">Subscriber</span>
                </div>
                <select 
                  value={subscriberFilter}
                  onChange={(e) => setSubscriberFilter(e.target.value)}
                  className="px-3 py-1.5 border border-indigo-200 rounded text-sm outline-none bg-white text-slate-700 min-w-[150px]"
                >
                  <option value="All">All Subscribers</option>
                  {uniqueSubscribers.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
          <div className="text-xs text-slate-400 font-medium bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
            Showing {filteredData.length} of {orders.length} orders
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6 mb-8">
          <Card title="Total" value={stats.total} icon={Package} colorClass="bg-slate-100 text-slate-600" />
          <Card title="Pending" value={stats.pending} icon={Clock} colorClass="bg-amber-100 text-amber-600" />
          <Card title="Escalated" value={stats.escalated} icon={AlertCircle} colorClass="bg-red-100 text-red-600" />
          <Card title="Confirmed" value={stats.confirmed} icon={CheckCircle} colorClass="bg-green-100 text-green-600" />
          <Card title="Reminded" value={stats.reminded} icon={Bell} colorClass="bg-blue-100 text-blue-600" />
          <Card title="Cancelled" value={stats.cancelled} icon={XCircle} colorClass="bg-slate-200 text-slate-600" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
              Status Distribution
            </h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
              Composition
            </h3>
            <div className="h-72 w-full relative">
              {stats.total === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                  <Package size={32} className="opacity-20" />
                  <span className="text-sm">No data found</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-800">
                  {isAdmin && subscriberFilter !== 'All' 
                    ? `Orders for ${subscriberFilter}` 
                    : 'All Orders List'}
                </h3>
                <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">Latest 100</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-100">
                        <tr>
                            {/* --- ADMIN ONLY COLUMN --- */}
                            {isAdmin && <th className="px-6 py-4">Subscriber</th>}
                            <th className="px-6 py-4">Order ID</th>
                            <th className="px-6 py-4">Created At</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Phone</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredData.length > 0 ? filteredData.slice(0, 100).map(order => (
                            <tr key={order.id} className="hover:bg-indigo-50/30 transition-colors">
                                
                                {/* --- ADMIN ONLY CELL --- */}
                                {isAdmin && (
                                  <td className="px-6 py-4 font-semibold text-indigo-600">
                                    {order.subscriber_name}
                                  </td>
                                )}

                                <td className="px-6 py-4 font-mono text-slate-600">{order.order_id}</td>
                                <td className="px-6 py-4 text-slate-600">
                                  {new Date(order.created_at).toLocaleDateString()}
                                  <span className="text-slate-400 text-xs ml-2">
                                    {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border
                                      ${order.status === 'CONFIRMED' ? 'bg-green-50 text-green-600 border-green-200' : 
                                        order.status === 'ESCALATED' ? 'bg-red-50 text-red-600 border-red-200' :
                                        order.status === 'REMINDED' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                        order.status === 'CANCELLED' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                        'bg-amber-50 text-amber-600 border-amber-200'
                                      }`}>
                                      {order.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-600 font-medium">{order.phone}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={isAdmin ? 5 : 4} className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                                      <Package size={32} className="opacity-20" />
                                      <p>No orders found for this criteria</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

      </main>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  const handleLogin = (username, password) => {
    // 1. Admin Check
    if (username === 'admin' && password === '1234') {
      setUser('admin');
      setError('');
      return;
    }

    // 2. Regular User Check
    if (password === '1234' && username.trim() !== '') {
      setUser(username);
      setError('');
    } else {
      setError('Invalid credentials');
    }
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <>
      {!user ? (
        <Login onLogin={handleLogin} error={error} />
      ) : (
        <Dashboard user={user} onLogout={handleLogout} />
      )}
    </>
  );
}