import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { orderApi, customerApi, productApi } from '../api';
import { Plus, Search, Trash2, Eye, X, ShoppingCart, PlusCircle, MinusCircle, Package, ArrowRight, User } from 'lucide-react';
import ConfirmationModal from '../components/layout/ConfirmationModal';
import { Helmet } from 'react-helmet-async';

const Orders = ({ addToast }) => {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal toggle states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // Confirmation Modal state
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  
  // Active details order
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Form states for Create Order
  const [customerId, setCustomerId] = useState('');
  const [selectedItems, setSelectedItems] = useState([]); // Array of { product_id, quantity, details }
  const [formErrors, setFormErrors] = useState({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [orderList, customerList, productList] = await Promise.all([
        orderApi.getAll(),
        customerApi.getAll(),
        productApi.getAll(),
      ]);
      setOrders(orderList);
      setCustomers(customerList);
      setProducts(productList);
    } catch (err) {
      addToast('Failed to load transaction data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setCustomerId('');
    setSelectedItems([]);
    setFormErrors({});
    setIsCreateOpen(true);
  };

  // Fast add product to cart (defaults to 1 quantity or increments existing)
  const handleAddProduct = (product) => {
    if (product.available_stock <= 0) {
      addToast(`Product '${product.name}' is out of stock.`, 'warning');
      return;
    }

    const existingIndex = selectedItems.findIndex(item => item.product_id === product.id);

    if (existingIndex > -1) {
      const currentQty = selectedItems[existingIndex].quantity;
      if (currentQty >= product.available_stock) {
        addToast(`Cannot add more. Only ${product.available_stock} units are available in stock.`, 'warning');
        return;
      }
      const updated = [...selectedItems];
      updated[existingIndex].quantity += 1;
      setSelectedItems(updated);
      addToast(`Incremented '${product.name}' in checkout list.`, 'info');
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          product_id: product.id,
          quantity: 1,
          details: product
        }
      ]);
      addToast(`Added '${product.name}' to checkout list.`, 'success');
    }
  };

  const handleUpdateQty = (index, delta) => {
    const item = selectedItems[index];
    const currentQty = parseInt(item.quantity, 10) || 0;
    const newQty = currentQty + delta;
    
    if (newQty <= 0) {
      handleRemoveLineItem(index);
      return;
    }

    if (newQty > item.details.available_stock) {
      addToast(`Only ${item.details.available_stock} units are available in stock.`, 'warning');
      return;
    }

    const updated = [...selectedItems];
    updated[index].quantity = newQty;
    setSelectedItems(updated);
  };

  const handleSetQty = (index, val) => {
    const item = selectedItems[index];
    
    if (val === '' || isNaN(val)) {
      const updated = [...selectedItems];
      updated[index].quantity = '';
      setSelectedItems(updated);
      return;
    }

    if (val < 0) {
      addToast('Quantity cannot be negative.', 'warning');
      return;
    }

    if (val > item.details.available_stock) {
      addToast(`Only ${item.details.available_stock} units are available in stock.`, 'warning');
      const updated = [...selectedItems];
      updated[index].quantity = item.details.available_stock;
      setSelectedItems(updated);
      return;
    }

    const updated = [...selectedItems];
    updated[index].quantity = val;
    setSelectedItems(updated);
  };

  const handleQtyBlur = (index) => {
    const item = selectedItems[index];
    const qty = parseInt(item.quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      const updated = [...selectedItems];
      updated[index].quantity = 1;
      setSelectedItems(updated);
      addToast(`Reset quantity for '${item.details.name}' to 1.`, 'info');
    }
  };

  const handleRemoveLineItem = (index) => {
    const item = selectedItems[index];
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
    addToast(`Removed '${item.details.name}' from checkout list.`, 'info');
  };

  const calculateGrandTotal = () => {
    return selectedItems.reduce((acc, item) => {
      const qty = parseInt(item.quantity, 10) || 0;
      return acc + (parseFloat(item.details.price) * qty);
    }, 0);
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!customerId) errors.customerId = 'Please select a customer for this order.';
    if (selectedItems.length === 0) errors.items = 'Please add at least one product to check out.';

    // Validate quantities
    const invalidItems = selectedItems.filter(item => {
      const q = parseInt(item.quantity, 10);
      return isNaN(q) || q <= 0;
    });

    if (invalidItems.length > 0) {
      errors.items = 'Please enter a valid quantity greater than zero for all items.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setFormErrors({});

    const payload = {
      customer_id: customerId,
      items: selectedItems.map(item => ({
        product_id: item.product_id,
        quantity: parseInt(item.quantity, 10)
      }))
    };

    try {
      await orderApi.create(payload);
      addToast('Order successfully placed and inventory updated!', 'success');
      setIsCreateOpen(false);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to place order.';
      addToast(msg, 'error');
    }
  };

  const handleViewDetails = async (id) => {
    try {
      const details = await orderApi.getById(id);
      setSelectedOrder(details);
      setIsDetailsOpen(true);
    } catch (err) {
      addToast('Failed to load order breakdown.', 'error');
    }
  };

  const openDeleteConfirm = (order) => {
    setOrderToDelete(order);
    setConfirmDeleteOpen(true);
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    try {
      await orderApi.delete(orderToDelete.id);
      addToast('Order status set to cancelled and stock levels restored.', 'success');
      setConfirmDeleteOpen(false);
      setOrderToDelete(null);
      fetchData();
    } catch (err) {
      addToast('Failed to cancel order.', 'error');
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      <Helmet>
        <title>Sales Orders - Quantum Inventory System</title>
        <meta name="description" content="Manage customer sales orders and view invoices." />
        <meta property="og:title" content="Sales Orders - Quantum Inventory System" />
      </Helmet>
      <div className="page-header">
        <div className="page-title-group">
          <h1>Sales Orders</h1>
          <p>Create and log sales, inspect invoices, and track warehouse dispatches.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={18} />
          Create Order
        </button>
      </div>

      {loading && orders.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
          <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid #ebebeb', borderTopColor: 'var(--color-primary)', borderRadius: '50%' }}></div>
        </div>
      ) : (
        <div className="glass-panel">
          {orders.length === 0 ? (
            <div className="empty-state">
              <ShoppingCart size={48} style={{ color: 'var(--text-muted)' }} />
              <div className="empty-state-title">No orders logged yet</div>
              <div className="empty-state-subtitle">Click "Create Order" at the top right to start a transaction checkout.</div>
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Order Reference</th>
                    <th>Customer Name</th>
                    <th>Subtotal Price</th>
                    <th>Order Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.8rem' }}>
                        {order.id.substring(0, 8).toUpperCase()}...
                      </td>
                      <td style={{ fontWeight: 600 }}>{order.customer_name}</td>
                      <td style={{ color: 'var(--color-success)', fontWeight: 600 }}>${parseFloat(order.total_amount).toFixed(2)}</td>
                      <td>{new Date(order.created_at).toLocaleString()}</td>
                      <td>
                        {order.status === 'cancelled' ? (
                          <span className="badge badge-danger">Cancelled</span>
                        ) : (
                          <span className="badge badge-success">Completed</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            className="btn btn-secondary btn-icon"
                            onClick={() => handleViewDetails(order.id)}
                            title="View Invoice Details"
                          >
                            <Eye size={16} />
                          </button>
                          {order.status !== 'cancelled' && (
                            <button
                              className="btn btn-danger btn-icon"
                              onClick={() => openDeleteConfirm(order)}
                              title="Cancel Order & Restock"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CREATE ORDER MODAL */}
      {isCreateOpen && createPortal(
        <div className="modal-overlay" onClick={() => setIsCreateOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '850px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create Sales Order</h3>
              <button className="modal-close" onClick={() => setIsCreateOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateOrder}>
              {/* Customer Selection */}
              <div className="form-group">
                <label className="form-label">Customer Profile *</label>
                <select
                  className={`form-control ${formErrors.customerId ? 'border-red-500' : ''}`}
                  value={customerId}
                  onChange={(e) => { setCustomerId(e.target.value); setFormErrors({...formErrors, customerId: null}); }}
                >
                  <option value="">-- Select Client Profile --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                  ))}
                </select>
                {formErrors.customerId && <p className="text-red-500 text-xs mt-1">{formErrors.customerId}</p>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', marginTop: '20px' }}>
                
                {/* Product Catalog Dropdown */}
                <div>
                  <label className="form-label">Catalog Products</label>
                  <div style={{ marginBottom: '12px' }}>
                    <select
                      className="form-control"
                      onChange={(e) => {
                        const p = products.find(prod => prod.id === e.target.value);
                        if (p) handleAddProduct(p);
                        e.target.value = ""; // Reset after selection
                      }}
                    >
                      <option value="">-- Select Product to Add --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id} disabled={p.available_stock <= 0}>
                          {p.name} ({p.sku}) — ${parseFloat(p.price).toFixed(2)} {p.available_stock <= 0 ? '(Out of stock)' : `· ${p.available_stock} in stock`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Inline Checkout Cart */}
                <div>
                  <label className="form-label">Checkout Invoice List</label>
                  {formErrors.items && <p className="text-red-500 text-xs mb-2">{formErrors.items}</p>}
                  <div className={`cart-drawer-card ${formErrors.items ? 'border-red-500' : ''}`} style={{ height: '298px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                    {selectedItems.length === 0 ? (
                      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', padding: '20px 0' }}>
                        <ShoppingCart size={32} style={{ marginBottom: '8px' }} />
                        <span style={{ fontSize: '0.85rem' }}>Your invoice list is empty</span>
                        <span style={{ fontSize: '0.75rem', textAlign: 'center' }}>Select products from the dropdown above to add them.</span>
                      </div>
                    ) : (
                      <div style={{ flexGrow: 1 }}>
                        {selectedItems.map((item, idx) => (
                          <div className="cart-item-row" key={item.product_id}>
                            <div className="cart-item-info">
                              <span className="cart-item-name">{item.details.name}</span>
                              <span className="cart-item-sku">${parseFloat(item.details.price).toFixed(2)} / unit</span>
                            </div>
                            <div className="cart-item-qty-selector">
                              <button 
                                type="button" 
                                className="qty-btn" 
                                onClick={() => handleUpdateQty(idx, -1)}
                              >
                                <MinusCircle size={15} />
                              </button>
                              <input
                                type="number"
                                className="qty-input"
                                value={item.quantity}
                                onChange={(e) => handleSetQty(idx, e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                                onBlur={() => handleQtyBlur(idx)}
                                style={{
                                  width: '45px',
                                  textAlign: 'center',
                                  padding: '2px 0',
                                  height: '24px',
                                  borderRadius: '4px',
                                  fontWeight: '600',
                                  border: '1px solid var(--glass-border)',
                                  outline: 'none',
                                  background: '#ffffff',
                                  color: 'var(--text-primary)'
                                }}
                              />
                              <button 
                                type="button" 
                                className="qty-btn" 
                                onClick={() => handleUpdateQty(idx, 1)}
                                disabled={item.quantity >= item.details.available_stock}
                              >
                                <PlusCircle size={15} />
                              </button>
                              <button 
                                type="button" 
                                className="qty-btn" 
                                onClick={() => handleRemoveLineItem(idx)}
                                style={{ borderColor: 'transparent', marginLeft: '6px' }}
                              >
                                <X size={15} className="text-red-500" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {selectedItems.length > 0 && (
                      <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '12px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Invoice Total:</span>
                        <span style={{ fontWeight: 700, color: 'var(--color-success)', fontSize: '1.15rem' }}>
                          ${calculateGrandTotal().toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={selectedItems.length === 0}>
                  Confirm Checkout
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* VIEW DETAILS MODAL */}
      {isDetailsOpen && selectedOrder && createPortal(
        <div className="modal-overlay" onClick={() => setIsDetailsOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Order Invoice Summary</h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                  ID: {selectedOrder.id}
                </div>
              </div>
              <button className="modal-close" onClick={() => setIsDetailsOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Customer Account</div>
                  <div style={{ fontWeight: 600, fontSize: '1rem', marginTop: '2px' }}>{selectedOrder.customer_name}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Timestamp</div>
                  <div style={{ fontWeight: 500, marginTop: '2px' }}>{new Date(selectedOrder.created_at).toLocaleString()}</div>
                </div>
              </div>
              
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Unit Cost</th>
                      <th>Quantity</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 600 }}>{item.product_name}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{item.sku}</td>
                        <td>${parseFloat(item.unit_price).toFixed(2)}</td>
                        <td>{item.quantity}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          ${(parseFloat(item.unit_price) * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    <tr style={{ background: '#fafafa' }}>
                      <td colSpan="4" style={{ fontWeight: 'bold', textAlign: 'right' }}>Grand Total Paid:</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--color-success)', fontSize: '1.1rem' }}>
                        ${parseFloat(selectedOrder.total_amount).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              {selectedOrder.status !== 'cancelled' && (
                <button 
                  className="btn btn-danger" 
                  onClick={() => {
                    setIsDetailsOpen(false);
                    openDeleteConfirm(selectedOrder);
                  }}
                >
                  Cancel Order
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => setIsDetailsOpen(false)}>Close Invoice</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmationModal
        isOpen={confirmDeleteOpen}
        title="Cancel Sales Order?"
        message={`Are you sure you want to cancel the order for ${orderToDelete?.customer_name}? This will restore the purchased item quantities back into the warehouse stock levels.`}
        confirmText="Yes, Cancel Order"
        cancelText="No, Keep Active"
        onConfirm={handleDeleteOrder}
        onCancel={() => {
          setConfirmDeleteOpen(false);
          setOrderToDelete(null);
        }}
        type="danger"
      />
    </div>
  );
};

export default Orders;
