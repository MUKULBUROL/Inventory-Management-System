import React, { useState, useEffect } from 'react';
import { dashboardApi } from '../api';
import { Package, Users, ShoppingCart, AlertTriangle, Layers, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Helmet } from 'react-helmet-async';

const Dashboard = ({ addToast }) => {
  const [stats, setStats] = useState({
    total_products: 0,
    total_customers: 0,
    total_orders: 0,
    low_stock_products: [],
  });
  const [loading, setLoading] = useState(true);

  // Mock data for the chart to simulate real-time sales
  const mockChartData = [
    { name: 'Mon', sales: 4000 },
    { name: 'Tue', sales: 3000 },
    { name: 'Wed', sales: 2000 },
    { name: 'Thu', sales: 2780 },
    { name: 'Fri', sales: 1890 },
    { name: 'Sat', sales: 2390 },
    { name: 'Sun', sales: 3490 },
  ];

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await dashboardApi.getStats();
      setStats(data);
    } catch (err) {
      console.error(err);
      addToast('Failed to fetch dashboard metrics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      <Helmet>
        <title>Dashboard - Quantum Inventory</title>
        <meta name="description" content="View real-time analytics and inventory performance." />
        <meta property="og:title" content="Dashboard - Quantum Inventory" />
      </Helmet>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Analytics Dashboard</h1>
          <p className="text-gray-500 mt-1 text-sm">Real-time overview of your warehouse, operations, and sales.</p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Live Metrics
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Products</span>
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Package className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-gray-900">{stats.total_products}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Customers</span>
            <div className="p-2 bg-green-50 rounded-lg">
              <Users className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-gray-900">{stats.total_customers}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Orders</span>
            <div className="p-2 bg-blue-50 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-gray-900">{stats.total_orders}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-red-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <span className="text-sm font-semibold text-red-500 uppercase tracking-wider">Warnings</span>
            <div className="p-2 bg-red-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className={`text-3xl font-bold ${stats.low_stock_products.length > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {stats.low_stock_products.length}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Sales Overview</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dx={-10} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                />
                <Line type="monotone" dataKey="sales" stroke="#4F46E5" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Low Stock Alert</h3>
            <span className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-full flex items-center">
              <AlertTriangle className="w-3 h-3 mr-1" /> Critical
            </span>
          </div>

          {stats.low_stock_products.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <Layers className="w-12 h-12 text-green-400 mb-4" />
              <p className="text-gray-900 font-medium">All items stocked!</p>
              <p className="text-gray-500 text-sm mt-1">Inventory levels are healthy.</p>
            </div>
          ) : (
            <div className="overflow-y-auto pr-2 -mr-2 flex-1">
              <ul className="space-y-4">
                {stats.low_stock_products.map((product) => (
                  <li key={product.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">{product.sku}</p>
                    </div>
                    <div className="ml-4 flex flex-col items-end">
                      <span className="text-sm font-bold text-gray-900">{product.quantity}</span>
                      <span className="text-xs text-gray-500">in stock</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
