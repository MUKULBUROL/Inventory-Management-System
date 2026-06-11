import React, { useEffect, useState } from 'react';
import { PackagePlus, ShoppingCart, RefreshCw, ArrowDownRight, ArrowUpRight, PackageMinus } from 'lucide-react';
import { format } from 'date-fns';

const getEventIcon = (type) => {
  switch(type) {
    case 'StockReceived': return <PackagePlus className="w-4 h-4 text-emerald-500" />;
    case 'StockSold': return <ShoppingCart className="w-4 h-4 text-rose-500" />;
    case 'StockAdjusted': return <RefreshCw className="w-4 h-4 text-indigo-500" />;
    case 'StockReturned': return <ArrowDownRight className="w-4 h-4 text-emerald-500" />;
    case 'StockTransferred': return <ArrowUpRight className="w-4 h-4 text-amber-500" />;
    default: return <PackageMinus className="w-4 h-4 text-gray-500" />;
  }
};

const ActivityFeed = () => {
  const [events, setEvents] = useState([]);
  
  // This is a mock simulation of a WebSocket feed for demo purposes
  // In a real app, this would connect to ws://localhost:8000/api/v1/inventory/ws
  useEffect(() => {
    // Initial mock events
    setEvents([
      { id: '1', type: 'StockSold', message: 'Order #1234 sold 5 units of Ergonomic Chair', time: new Date(Date.now() - 1000 * 60 * 5) },
      { id: '2', type: 'StockAdjusted', message: 'Cycle count adjustment for Monitor Stand', time: new Date(Date.now() - 1000 * 60 * 30) },
      { id: '3', type: 'StockReceived', message: 'Received 50 units of Wireless Mouse', time: new Date(Date.now() - 1000 * 60 * 120) },
    ]);

    // Simulate incoming websocket events
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const newEvent = {
          id: Date.now().toString(),
          type: 'StockSold',
          message: `Order #${Math.floor(Math.random() * 9000) + 1000} sold units`,
          time: new Date()
        };
        setEvents(prev => [newEvent, ...prev].slice(0, 10)); // Keep last 10
      }
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="surface-card p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold tracking-tight">Live Activity Feed</h3>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Live</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto pr-2">
        <ul className="space-y-4">
          {events.map(event => (
            <li key={event.id} className="flex gap-4">
              <div className="mt-0.5 bg-gray-50 p-1.5 rounded-full border border-gray-100 shadow-sm h-min">
                {getEventIcon(event.type)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{event.message}</p>
                <p className="text-xs text-gray-400 mt-1">{format(event.time, 'h:mm a')}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ActivityFeed;
