import React from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '../api';
import { X, ArrowUpRight, ArrowDownRight, PackageMinus, PackagePlus, RefreshCw, ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';

const ProductLedgerModal = ({ isOpen, onClose, product }) => {
  const { data: events, isLoading } = useQuery({
    queryKey: ['ledger', product?.id],
    queryFn: () => inventoryApi.getLedger(product.id),
    enabled: !!product && isOpen,
  });

  if (!isOpen || !product) return null;

  const getEventIcon = (type) => {
    switch(type) {
      case 'StockReceived': return <PackagePlus className="w-5 h-5 text-emerald-500" />;
      case 'StockSold': return <ShoppingCart className="w-5 h-5 text-rose-500" />;
      case 'StockAdjusted': return <RefreshCw className="w-5 h-5 text-indigo-500" />;
      case 'StockReturned': return <ArrowDownRight className="w-5 h-5 text-emerald-500" />;
      case 'StockTransferred': return <ArrowUpRight className="w-5 h-5 text-amber-500" />;
      default: return <PackageMinus className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatEventType = (type) => {
    return type.replace('Stock', '');
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content !max-w-3xl !max-h-[80vh]" onClick={e => e.stopPropagation()}>
        <div className="modal-header bg-gray-50/80">
          <div>
            <h3 className="modal-title">Inventory Timeline</h3>
            <p className="text-sm text-gray-500 mt-1">{product.name} ({product.sku})</p>
          </div>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className="p-6 overflow-y-auto bg-gray-50/30">
          {isLoading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
          ) : !events || events.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No events found in ledger.</div>
          ) : (
            <div className="relative border-l-2 border-gray-100 ml-4 pl-6 space-y-8 py-2">
              {events.map((event, idx) => (
                <div key={event.id} className="relative">
                  <div className="absolute -left-[35px] bg-white p-1 rounded-full border border-gray-100 shadow-sm">
                    {getEventIcon(event.event_type)}
                  </div>
                  <div className="surface-card p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{formatEventType(event.event_type)}</span>
                        {event.quantity_change > 0 ? (
                          <span className="text-emerald-600 font-bold bg-emerald-50 px-2 rounded-md">+{event.quantity_change}</span>
                        ) : (
                          <span className="text-rose-600 font-bold bg-rose-50 px-2 rounded-md">{event.quantity_change}</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 font-medium">
                        {format(new Date(event.timestamp), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <p className="text-gray-500">{event.reason || 'No reason provided'}</p>
                      <div className="text-right">
                        <p className="text-gray-400 text-xs uppercase tracking-wider mb-0.5">Running Balance</p>
                        <p className="font-mono text-gray-700">{event.after_value}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ProductLedgerModal;
