import React from 'react';
import { Building2, MapPin, Package, AlertTriangle } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const Warehouses = ({ addToast }) => {
  // Mock data for V2 demo
  const warehouses = [
    {
      id: 1,
      name: 'Main HQ',
      location: 'San Francisco, CA',
      capacity: '85%',
      status: 'Healthy',
      itemCount: 14500,
      alerts: 0
    },
    {
      id: 2,
      name: 'East Coast Hub',
      location: 'New York, NY',
      capacity: '92%',
      status: 'Warning',
      itemCount: 22100,
      alerts: 3
    },
    {
      id: 3,
      name: 'European Distribution',
      location: 'Berlin, DE',
      capacity: '45%',
      status: 'Healthy',
      itemCount: 8200,
      alerts: 0
    }
  ];

  const handleMockClick = () => {
    if (addToast) {
      addToast('This feature is slated for Phase 2.', 'info');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto pb-20">
      <Helmet>
        <title>Warehouses - Quantum Inventory System</title>
      </Helmet>
      
      <div className="page-header">
        <div className="page-title-group">
          <h1>Facility Management</h1>
          <p>Monitor multi-warehouse capacity and distribution operations.</p>
        </div>
        <button className="btn btn-primary" onClick={handleMockClick}>
          Add Facility
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {warehouses.map((wh) => (
          <div key={wh.id} className="surface-card p-6 flex flex-col justify-between hover:shadow-md transition-all duration-300">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <Building2 className="w-6 h-6 text-gray-700" />
                </div>
                {wh.alerts > 0 ? (
                  <span className="badge badge-warning gap-1">
                    <AlertTriangle className="w-3 h-3" /> {wh.alerts} Alerts
                  </span>
                ) : (
                  <span className="badge badge-success">Healthy</span>
                )}
              </div>
              <h3 className="text-xl font-bold text-gray-900">{wh.name}</h3>
              <p className="flex items-center text-gray-500 text-sm mt-2">
                <MapPin className="w-4 h-4 mr-1" />
                {wh.location}
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-500">Storage Capacity</span>
                <span className="text-sm font-bold text-gray-900">{wh.capacity}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-6">
                <div 
                  className={`h-2 rounded-full ${parseInt(wh.capacity) > 90 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: wh.capacity }}
                ></div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center text-sm font-medium text-gray-700">
                  <Package className="w-4 h-4 mr-2 text-gray-400" />
                  {wh.itemCount.toLocaleString()} items
                </div>
                <button 
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                  onClick={handleMockClick}
                >
                  View Layout &rarr;
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Warehouses;
