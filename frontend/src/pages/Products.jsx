import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { productApi } from '../api';
import { Plus, Search, Edit2, Trash2, X, Package, Activity, ArrowRightLeft } from 'lucide-react';
import ConfirmationModal from '../components/layout/ConfirmationModal';
import { Helmet } from 'react-helmet-async';
import { useVirtualizer } from '@tanstack/react-virtual';
import SkeletonLoader from '../components/SkeletonLoader';
import AdjustStockModal from '../components/AdjustStockModal';
import ProductLedgerModal from '../components/ProductLedgerModal';

const Products = ({ addToast }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: products = [], isLoading, isFetching } = useQuery({
    queryKey: ['products', debouncedSearch],
    queryFn: () => productApi.getAll(debouncedSearch),
    placeholderData: keepPreviousData,
  });

  // Virtualizer Setup
  const parentRef = useRef(null);
  const rowVirtualizer = useVirtualizer({
    count: products.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64, // Estimated row height
    overscan: 10,
  });

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [adjustStockOpen, setAdjustStockOpen] = useState(false);
  const [ledgerOpen, setLedgerOpen] = useState(false);
  
  const [activeProduct, setActiveProduct] = useState(null);
  
  // Form state
  const [form, setForm] = useState({ name: '', sku: '', price: '' });
  const [formErrors, setFormErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    if (!form.name) errors.name = 'Name is required';
    if (!form.sku) errors.sku = 'SKU is required';
    const parsedPrice = parseFloat(form.price);
    if (!form.price) errors.price = 'Price is required';
    else if (isNaN(parsedPrice) || parsedPrice <= 0) errors.price = 'Price must be positive';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const createMutation = useMutation({
    mutationFn: (data) => productApi.create(data),
    onSuccess: () => {
      addToast('Product created successfully!', 'success');
      setIsCreateOpen(false);
      queryClient.invalidateQueries(['products']);
    },
    onError: (err) => {
      addToast(err.response?.data?.detail || 'Failed to create product.', 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => productApi.update(activeProduct.id, data),
    onSuccess: () => {
      addToast('Product updated successfully!', 'success');
      setIsEditOpen(false);
      queryClient.invalidateQueries(['products']);
    },
    onError: (err) => {
      addToast(err.response?.data?.detail || 'Failed to update product.', 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => productApi.delete(id),
    onSuccess: () => {
      addToast('Product deleted successfully.', 'success');
      setConfirmDeleteOpen(false);
      setActiveProduct(null);
      queryClient.invalidateQueries(['products']);
    },
    onError: (err) => {
      addToast(err.response?.data?.detail || 'Failed to delete product.', 'error');
      setConfirmDeleteOpen(false);
    }
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    // Initial quantity is not handled here anymore, stock adjustments via ledger
    createMutation.mutate({
      name: form.name,
      sku: form.sku,
      price: parseFloat(form.price),
      quantity: 0 // Legacy compatibility field, but ledger handles true stock
    });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    updateMutation.mutate({
      name: form.name,
      sku: form.sku,
      price: parseFloat(form.price)
    });
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto pb-20">
      <Helmet>
        <title>Products - Quantum Inventory System</title>
      </Helmet>
      
      <div className="page-header">
        <div className="page-title-group">
          <h1>Product Catalog</h1>
          <p>Manage items, view ledger history, and adjust stock levels.</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setForm({ name: '', sku: '', price: '' });
          setFormErrors({});
          setIsCreateOpen(true);
        }}>
          <Plus size={18} />
          Add Product
        </button>
      </div>

      <div className="search-bar-container mb-8">
        <div className="search-input-wrapper max-w-md">
          <Search className="search-icon" />
          <input
            type="text"
            className="form-control search-input bg-white"
            placeholder="Search catalog by name or SKU (Press / to focus)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="surface-card flex flex-col min-h-[500px] relative">
        {isLoading ? (
          <div className="p-4 space-y-4">
            <SkeletonLoader variant="table-row" />
            <SkeletonLoader variant="table-row" />
            <SkeletonLoader variant="table-row" />
            <SkeletonLoader variant="table-row" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex-1 empty-state">
            <Package size={48} className="text-gray-300 mb-4" />
            <h3 className="empty-state-title">No products found</h3>
            <p className="empty-state-subtitle">Adjust your search or add a new product to the catalog.</p>
          </div>
        ) : (
          <>
            {isFetching && (
              <div className="absolute top-3 right-4 z-20 flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 border-t-indigo-500 animate-spin" />
                <span className="text-xs text-gray-400 font-medium">Searching...</span>
              </div>
            )}
          <div className={`flex-1 overflow-auto rounded-xl transition-opacity duration-150 ${isFetching ? 'opacity-60' : 'opacity-100'}`} ref={parentRef} style={{ height: '600px' }}>
            <table className="custom-table w-full">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Available</th>
                  <th>Status</th>
                  <th className="text-right pr-8">Actions</th>
                </tr>
              </thead>
              <tbody style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const product = products[virtualRow.index];
                  const isLow = product.available_stock < 10 && product.available_stock > 0;
                  const isOut = product.available_stock <= 0;

                  return (
                    <tr 
                      key={product.id} 
                      className="absolute w-full flex items-center border-b border-gray-50 hover:bg-gray-50/80 transition-colors group"
                      style={{ height: `${virtualRow.size}px`, transform: `translateY(${virtualRow.start}px)` }}
                    >
                      <td className="w-1/6 px-6 font-medium text-gray-900 truncate">{product.name}</td>
                      <td className="w-1/6 px-6 font-mono text-xs text-gray-500">{product.sku}</td>
                      <td className="w-1/6 px-6">${parseFloat(product.price).toFixed(2)}</td>
                      <td className="w-1/6 px-6 font-semibold">{product.available_stock}</td>
                      <td className="w-1/6 px-6">
                        {isOut ? (
                          <span className="badge badge-danger">Out of Stock</span>
                        ) : isLow ? (
                          <span className="badge badge-warning">Low Stock</span>
                        ) : (
                          <span className="badge badge-success">Available</span>
                        )}
                      </td>
                      <td className="w-1/6 px-6 flex justify-end gap-2 pr-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors tooltip-trigger" 
                                title="View Ledger"
                                onClick={() => { setActiveProduct(product); setLedgerOpen(true); }}>
                          <Activity size={16} />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors tooltip-trigger" 
                                title="Adjust Stock"
                                onClick={() => { setActiveProduct(product); setAdjustStockOpen(true); }}>
                          <ArrowRightLeft size={16} />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors tooltip-trigger" 
                                title="Edit Product"
                                onClick={() => {
                                  setActiveProduct(product);
                                  setForm({ name: product.name, sku: product.sku, price: product.price.toString() });
                                  setFormErrors({});
                                  setIsEditOpen(true);
                                }}>
                          <Edit2 size={16} />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors tooltip-trigger" 
                                title="Delete"
                                onClick={() => { setActiveProduct(product); setConfirmDeleteOpen(true); }}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>

      {/* CREATE MODAL */}
      {isCreateOpen && createPortal(
        <div className="modal-overlay" onClick={() => setIsCreateOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">New Product</h3>
              <button className="modal-close" onClick={() => setIsCreateOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="p-6 space-y-4">
                <div className="form-group !px-0 !mb-0">
                  <label className="form-label">Product Name</label>
                  <input type="text" className={`form-control ${formErrors.name ? 'border-red-500' : ''}`} value={form.name} onChange={e => setForm({...form, name: e.target.value})} autoFocus/>
                  {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group !px-0 !mb-0">
                    <label className="form-label">SKU</label>
                    <input type="text" className={`form-control ${formErrors.sku ? 'border-red-500' : ''}`} value={form.sku} onChange={e => setForm({...form, sku: e.target.value})}/>
                    {formErrors.sku && <p className="text-red-500 text-xs mt-1">{formErrors.sku}</p>}
                  </div>
                  <div className="form-group !px-0 !mb-0">
                    <label className="form-label">Price ($)</label>
                    <input type="number" step="0.01" className={`form-control ${formErrors.price ? 'border-red-500' : ''}`} value={form.price} onChange={e => setForm({...form, price: e.target.value})}/>
                    {formErrors.price && <p className="text-red-500 text-xs mt-1">{formErrors.price}</p>}
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isLoading}>Create</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* EDIT MODAL */}
      {isEditOpen && createPortal(
        <div className="modal-overlay" onClick={() => setIsEditOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Product Details</h3>
              <button className="modal-close" onClick={() => setIsEditOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="p-6 space-y-4">
                <div className="form-group !px-0 !mb-0">
                  <label className="form-label">Product Name</label>
                  <input type="text" className={`form-control ${formErrors.name ? 'border-red-500' : ''}`} value={form.name} onChange={e => setForm({...form, name: e.target.value})} autoFocus/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group !px-0 !mb-0">
                    <label className="form-label">SKU</label>
                    <input type="text" className={`form-control ${formErrors.sku ? 'border-red-500' : ''}`} value={form.sku} onChange={e => setForm({...form, sku: e.target.value})}/>
                  </div>
                  <div className="form-group !px-0 !mb-0">
                    <label className="form-label">Price ($)</label>
                    <input type="number" step="0.01" className={`form-control ${formErrors.price ? 'border-red-500' : ''}`} value={form.price} onChange={e => setForm({...form, price: e.target.value})}/>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={updateMutation.isLoading}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      <ConfirmationModal
        isOpen={confirmDeleteOpen}
        title="Delete Product"
        message={`Are you sure you want to permanently remove ${activeProduct?.name}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => deleteMutation.mutate(activeProduct.id)}
        onCancel={() => setConfirmDeleteOpen(false)}
        type="danger"
      />

      <AdjustStockModal isOpen={adjustStockOpen} onClose={() => setAdjustStockOpen(false)} product={activeProduct} addToast={addToast} />
      <ProductLedgerModal isOpen={ledgerOpen} onClose={() => setLedgerOpen(false)} product={activeProduct} />
    </div>
  );
};

export default Products;
