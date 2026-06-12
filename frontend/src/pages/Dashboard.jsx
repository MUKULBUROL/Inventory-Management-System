import React from 'react';
import { dashboardApi } from '../api';
import { useQuery } from '@tanstack/react-query';
import { Package, Users, ShoppingCart, AlertTriangle, Layers, DollarSign, Activity, FileCheck2, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Helmet } from 'react-helmet-async';
import SkeletonLoader from '../components/SkeletonLoader';
import ActivityFeed from '../components/ActivityFeed';

const Dashboard = ({ addToast }) => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      try {
        return await dashboardApi.getStats();
      } catch (err) {
        addToast('Failed to fetch dashboard metrics.', 'error');
        throw err;
      }
    },
    refetchInterval: 30000, // Real-time polling every 30s
  });

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

  return (
    <div className="p-8 pb-20 max-w-7xl mx-auto">
      <Helmet>
        <title>Dashboard - Quantum Inventory System</title>
        <meta name="description" content="View real-time analytics and inventory performance." />
      </Helmet>
      
      <div className="page-header">
        <div className="page-title-group">
          <h1>Analytics Dashboard</h1>
          <p>Real-time overview of your warehouse, operations, and sales.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {isLoading ? (
          <>
            <SkeletonLoader variant="metric" />
            <SkeletonLoader variant="metric" />
            <SkeletonLoader variant="metric" />
            <SkeletonLoader variant="metric" />
          </>
        ) : (
          <>
            <div className="surface-card p-6 flex flex-col justify-between cursor-default group transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_40px_-12px_rgba(16,185,129,0.6)] hover:bg-gradient-to-br hover:from-emerald-400 hover:to-emerald-600 hover:border-emerald-400">
              <div className="flex justify-between items-start">
                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider group-hover:text-emerald-50 transition-colors">Inventory Value</span>
                <div className="p-2 bg-emerald-50 rounded-lg group-hover:bg-white/20 transition-colors">
                  <DollarSign className="w-5 h-5 text-emerald-600 group-hover:text-white transition-colors" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight text-gray-900 group-hover:text-white transition-colors">${stats?.inventory_value?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
            </div>

            <div className="surface-card p-6 flex flex-col justify-between cursor-default group transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_40px_-12px_rgba(59,130,246,0.6)] hover:bg-gradient-to-br hover:from-blue-400 hover:to-indigo-600 hover:border-blue-400">
              <div className="flex justify-between items-start">
                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider group-hover:text-blue-50 transition-colors">Health Score</span>
                <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-white/20 transition-colors">
                  <Activity className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight text-gray-900 group-hover:text-white transition-colors">{stats?.inventory_health_score}/100</span>
                <span className="text-sm font-medium text-blue-600 group-hover:text-blue-100 transition-colors">Healthy</span>
              </div>
            </div>

            <div className="surface-card p-6 flex flex-col justify-between cursor-default group transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_40px_-12px_rgba(245,158,11,0.6)] hover:bg-gradient-to-br hover:from-amber-400 hover:to-orange-500 hover:border-amber-400">
              <div className="flex justify-between items-start">
                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider group-hover:text-amber-50 transition-colors">Dead Stock</span>
                <div className="p-2 bg-amber-50 rounded-lg group-hover:bg-white/20 transition-colors">
                  <Package className="w-5 h-5 text-amber-600 group-hover:text-white transition-colors" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight text-gray-900 group-hover:text-white transition-colors">${stats?.dead_stock_value?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
            </div>

            <div className="surface-card p-6 flex flex-col justify-between cursor-default group transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_40px_-12px_rgba(168,85,247,0.6)] hover:bg-gradient-to-br hover:from-purple-400 hover:to-fuchsia-500 hover:border-purple-400">
              <div className="flex justify-between items-start">
                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider group-hover:text-purple-50 transition-colors">Approvals</span>
                <div className="p-2 bg-indigo-50 rounded-lg group-hover:bg-white/20 transition-colors">
                  <FileCheck2 className="w-5 h-5 text-indigo-600 group-hover:text-white transition-colors" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight text-gray-900 group-hover:text-white transition-colors">{stats?.pending_approvals}</span>
                <span className="text-sm font-medium text-gray-500 group-hover:text-purple-100 transition-colors">Pending</span>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="col-span-2 surface-card p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:bg-gradient-to-br hover:from-cyan-50 hover:to-blue-50 hover:border-cyan-300">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-semibold tracking-tight">Sales & Forecasting</h3>
            <span className="badge badge-neutral">Next 30 Days</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Line type="monotone" dataKey="sales" stroke="#000" strokeWidth={2} dot={{r: 4, fill: '#000', strokeWidth: 2}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-1 surface-card overflow-hidden flex flex-col h-[400px] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_0_30px_rgba(244,63,94,0.3)] hover:bg-gradient-to-br hover:from-rose-50 hover:to-red-50 hover:border-rose-300">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-semibold tracking-tight">Low Stock Alert</h3>
            {stats?.low_stock_products?.length > 0 && (
              <span className="badge badge-danger gap-1">
                <AlertTriangle className="w-3 h-3" /> Critical
              </span>
            )}
          </div>

          <div className="p-6 flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-4">
                <SkeletonLoader variant="metric" className="!p-4 border border-gray-50 shadow-none" />
                <SkeletonLoader variant="metric" className="!p-4 border border-gray-50 shadow-none" />
              </div>
            ) : !stats?.low_stock_products || stats.low_stock_products.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-8">
                <Layers className="w-12 h-12 text-emerald-400 mb-4" />
                <p className="font-semibold text-gray-900">All items stocked!</p>
                <p className="text-gray-500 text-sm mt-1">Inventory levels are healthy.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {stats.low_stock_products.map((product) => (
                  <li key={product.id} className="flex justify-between items-center p-4 bg-gray-50/50 hover:bg-gray-50 rounded-xl border border-gray-100 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                      <p className="text-xs text-gray-500 font-mono mt-1">{product.sku}</p>
                    </div>
                    <div className="ml-4 flex flex-col items-end">
                      <span className="text-lg font-bold text-rose-600">{product.available_stock}</span>
                      <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Available</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-96">
        <ActivityFeed />
        <div className="surface-card p-6 flex flex-col items-center justify-center text-center transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:bg-gradient-to-br hover:from-emerald-50 hover:to-teal-50 hover:border-emerald-300">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
            <Activity className="w-8 h-8 text-indigo-500" />
          </div>
          <h3 className="text-lg font-semibold tracking-tight text-gray-900 mb-1">System Health</h3>
          <p className="text-sm text-gray-500 max-w-sm mb-6">All systems are operating normally. The inventory ledger is processing events with an average latency of 12ms.</p>
          <div className="flex gap-4">
            <div className="px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700 font-medium text-sm">
              API: 99.99%
            </div>
            <div className="px-4 py-2 bg-blue-50 border border-blue-100 rounded-lg text-blue-700 font-medium text-sm">
              DB: OK
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
