import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '../api';
import { X } from 'lucide-react';

const AdjustStockModal = ({ isOpen, onClose, product, addToast }) => {
  const [quantityChange, setQuantityChange] = useState('');
  const [reason, setReason] = useState('');
  const queryClient = useQueryClient();

  const adjustMutation = useMutation({
    mutationFn: (data) => inventoryApi.adjustStock(data),
    onSuccess: () => {
      addToast('Stock adjusted successfully', 'success');
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['dashboardStats']);
      onClose();
    },
    onError: (err) => {
      addToast(err.response?.data?.detail || 'Failed to adjust stock', 'error');
    }
  });

  if (!isOpen || !product) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const change = parseInt(quantityChange, 10);
    if (isNaN(change) || change === 0) {
      addToast('Please enter a valid quantity change', 'error');
      return;
    }
    adjustMutation.mutate({
      product_id: product.id,
      quantity_change: change,
      reason: reason || 'Manual adjustment'
    });
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Adjust Stock: {product.name}</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="surface-card p-4 mb-6 bg-gray-50/50 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500 font-medium">Current Available Stock</p>
                <p className="text-2xl font-bold text-gray-900">{product.available_stock}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 font-medium">New Stock</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {product.available_stock + (parseInt(quantityChange, 10) || 0)}
                </p>
              </div>
            </div>
            
            <div className="form-group !px-0">
              <label className="form-label">Adjustment Quantity (+/-)</label>
              <input 
                type="number" 
                className="form-control" 
                placeholder="e.g. 5 or -2" 
                value={quantityChange}
                onChange={e => setQuantityChange(e.target.value)}
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">Use negative values to deduct stock.</p>
            </div>

            <div className="form-group !px-0">
              <label className="form-label">Reason</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="e.g. Cycle count discrepancy" 
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
            </div>
          </div>
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={adjustMutation.isLoading}>
              {adjustMutation.isLoading ? 'Processing...' : 'Confirm Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default AdjustStockModal;
