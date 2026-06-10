import React, { useState, useEffect } from 'react';
import { customerApi } from '../api';
import { Plus, Search, Trash2, X, Users, Mail, Phone, Calendar } from 'lucide-react';
import ConfirmationModal from '../components/layout/ConfirmationModal';
import { Helmet } from 'react-helmet-async';

const Customers = ({ addToast }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [formErrors, setFormErrors] = useState({});

  const fetchCustomers = async (search = '') => {
    setLoading(true);
    try {
      const data = await customerApi.getAll(search);
      setCustomers(data);
    } catch (err) {
      addToast('Failed to fetch customers.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchCustomers(searchTerm);
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const handleOpenCreate = () => {
    setForm({ name: '', email: '', phone: '' });
    setFormErrors({});
    setIsCreateOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!form.name) errors.name = 'Full Name is required';
    if (!form.email) {
      errors.email = 'Email Address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Invalid email format';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await customerApi.create({
        name: form.name,
        email: form.email,
        phone: form.phone || null
      });
      addToast('Customer profile created successfully!', 'success');
      setIsCreateOpen(false);
      fetchCustomers(searchTerm);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to register customer.';
      addToast(msg, 'error');
    }
  };

  const openDeleteConfirm = (customer) => {
    setCustomerToDelete(customer);
    setConfirmDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!customerToDelete) return;
    try {
      await customerApi.delete(customerToDelete.id);
      addToast('Customer account deleted.', 'success');
      setConfirmDeleteOpen(false);
      setCustomerToDelete(null);
      fetchCustomers(searchTerm);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to delete customer profile.';
      addToast(msg, 'error');
      setConfirmDeleteOpen(false);
    }
  };

  return (
    <div>
      <Helmet>
        <title>Customers - Quantum Inventory</title>
        <meta name="description" content="Manage client profiles and view contact information." />
        <meta property="og:title" content="Customers - Quantum Inventory" />
      </Helmet>
      <div className="page-header">
        <div className="page-title-group">
          <h1>Customer Accounts</h1>
          <p>Register new clients, check email records, and manage profiles.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={18} />
          Register Customer
        </button>
      </div>

      <div className="search-bar-container">
        <div className="search-input-wrapper">
          <Search className="search-icon" />
          <input
            type="text"
            className="form-control search-input"
            placeholder="Search by name or email address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading && customers.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
          <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid #ebebeb', borderTopColor: 'var(--color-primary)', borderRadius: '50%' }}></div>
        </div>
      ) : (
        <div className="glass-panel">
          {customers.length === 0 ? (
            <div className="empty-state">
              <Users size={40} style={{ color: 'var(--text-muted)' }} />
              <div className="empty-state-title">No customers found</div>
              <div className="empty-state-subtitle">Register a new client profile at the top right to start logging transaction activities.</div>
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Email Address</th>
                    <th>Phone Number</th>
                    <th>Joined Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id}>
                      <td style={{ fontWeight: 600 }}>{customer.name}</td>
                      <td style={{ color: 'var(--color-success)', fontWeight: 500 }}>{customer.email}</td>
                      <td>{customer.phone || <span style={{ color: 'var(--text-muted)' }}>Not provided</span>}</td>
                      <td>{new Date(customer.created_at).toLocaleDateString()}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-danger btn-icon"
                          onClick={() => openDeleteConfirm(customer)}
                          title="Delete Customer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* REGISTER MODAL */}
      {isCreateOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Register Customer</h3>
              <button className="modal-close" onClick={() => setIsCreateOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className={`form-control ${formErrors.name ? 'border-red-500' : ''}`}
                  placeholder="e.g. John Doe"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
              </div>
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  className={`form-control ${formErrors.email ? 'border-red-500' : ''}`}
                  placeholder="e.g. john.doe@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. +1-555-0199 (Optional)"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Register Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmationModal
        isOpen={confirmDeleteOpen}
        title="Unregister Customer Profile?"
        message={`Are you sure you want to delete the account profile of '${customerToDelete?.name}' (Email: ${customerToDelete?.email})? This action cannot be undone. Note that deletion may fail if this client already has logged orders.`}
        confirmText="Remove Customer Account"
        cancelText="Keep Customer Account"
        onConfirm={handleDelete}
        onCancel={() => {
          setConfirmDeleteOpen(false);
          setCustomerToDelete(null);
        }}
        type="danger"
      />
    </div>
  );
};

export default Customers;
