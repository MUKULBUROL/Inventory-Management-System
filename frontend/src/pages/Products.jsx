import React, { useState, useEffect } from 'react';
import { productApi } from '../api';
import { Plus, Search, Edit2, Trash2, X, Package, Check } from 'lucide-react';
import ConfirmationModal from '../components/layout/ConfirmationModal';
import { Helmet } from 'react-helmet-async';

const Products = ({ addToast }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  
  // Form values
  const [form, setForm] = useState({ name: '', sku: '', price: '', quantity: '' });
  const [formErrors, setFormErrors] = useState({});
  const [currentId, setCurrentId] = useState(null);
  const [currentId, setCurrentId] = useState(null);

  const fetchProducts = async (search = '') => {
    setLoading(true);
    try {
      const data = await productApi.getAll(search);
      setProducts(data);
    } catch (err) {
      addToast('Failed to fetch products.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchProducts(searchTerm);
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const handleOpenCreate = () => {
    setForm({ name: '', sku: '', price: '', quantity: '0' });
    setFormErrors({});
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (product) => {
    setCurrentId(product.id);
    setForm({
      name: product.name,
      sku: product.sku,
      price: product.price.toString(),
      quantity: product.quantity.toString()
    });
    setFormErrors({});
    setIsEditOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!form.name) errors.name = 'Name is required';
    if (!form.sku) errors.sku = 'SKU is required';
    
    const parsedPrice = parseFloat(form.price);
    if (!form.price) errors.price = 'Price is required';
    else if (isNaN(parsedPrice) || parsedPrice <= 0) errors.price = 'Price must be a positive number';
    
    const parsedQty = parseInt(form.quantity, 10);
    if (form.quantity === '') errors.quantity = 'Quantity is required';
    else if (isNaN(parsedQty) || parsedQty < 0) errors.quantity = 'Quantity cannot be negative';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    const parsedPrice = parseFloat(form.price);
    const parsedQty = parseInt(form.quantity, 10);

    try {
      await productApi.create({
        name: form.name,
        sku: form.sku,
        price: parsedPrice,
        quantity: parsedQty
      });
      addToast('Product created successfully!', 'success');
      setIsCreateOpen(false);
      fetchProducts(searchTerm);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to create product.';
      addToast(msg, 'error');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    const parsedPrice = parseFloat(form.price);
    const parsedQty = parseInt(form.quantity, 10);

    try {
      await productApi.update(currentId, {
        name: form.name,
        sku: form.sku,
        price: parsedPrice,
        quantity: parsedQty
      });
      addToast('Product updated successfully!', 'success');
      setIsEditOpen(false);
      fetchProducts(searchTerm);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to update product.';
      addToast(msg, 'error');
    }
  };

  const openDeleteConfirm = (product) => {
    setProductToDelete(product);
    setConfirmDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      await productApi.delete(productToDelete.id);
      addToast('Product deleted successfully.', 'success');
      setConfirmDeleteOpen(false);
      setProductToDelete(null);
      fetchProducts(searchTerm);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to delete product.';
      addToast(msg, 'error');
      setConfirmDeleteOpen(false);
    }
  };

  return (
    <div>
      <Helmet>
        <title>Products Catalog - Quantum Inventory</title>
        <meta name="description" content="Manage your product catalog, prices, and stock levels." />
        <meta property="og:title" content="Products Catalog - Quantum Inventory" />
      </Helmet>
      <div className="page-header">
        <div className="page-title-group">
          <h1>Product Inventory</h1>
          <p>Add, edit, track quantities, and update catalog pricing.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={18} />
          Add Product
        </button>
      </div>

      <div className="search-bar-container">
        <div className="search-input-wrapper">
          <Search className="search-icon" />
          <input
            type="text"
            className="form-control search-input"
            placeholder="Search by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading && products.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
          <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid #ebebeb', borderTopColor: 'var(--color-primary)', borderRadius: '50%' }}></div>
        </div>
      ) : (
        <div className="glass-panel">
          {products.length === 0 ? (
            <div className="empty-state">
              <Package size={40} style={{ color: 'var(--text-muted)' }} />
              <div className="empty-state-title">No products found</div>
              <div className="empty-state-subtitle">Adjust your search parameters or register a new product catalog item.</div>
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>SKU/Code</th>
                    <th>Price</th>
                    <th>Stock Level</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td style={{ fontWeight: 600 }}>{product.name}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-primary)', fontWeight: 500 }}>{product.sku}</td>
                      <td>${parseFloat(product.price).toFixed(2)}</td>
                      <td>{product.quantity} units</td>
                      <td>
                        {product.quantity === 0 ? (
                          <span className="badge badge-danger">Out of Stock</span>
                        ) : product.quantity < 10 ? (
                          <span className="badge badge-warning">Low Stock</span>
                        ) : (
                          <span className="badge badge-success">Available</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            className="btn btn-secondary btn-icon"
                            onClick={() => handleOpenEdit(product)}
                            title="Edit Product"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="btn btn-danger btn-icon"
                            onClick={() => openDeleteConfirm(product)}
                            title="Delete Product"
                          >
                            <Trash2 size={16} />
                          </button>
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

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add New Product</h3>
              <button className="modal-close" onClick={() => setIsCreateOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input
                  type="text"
                  className={`form-control ${formErrors.name ? 'border-red-500' : ''}`}
                  placeholder="e.g. Ergonomic Office Chair"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
              </div>
              <div className="form-group">
                <label className="form-label">SKU/Code *</label>
                <input
                  type="text"
                  className={`form-control ${formErrors.sku ? 'border-red-500' : ''}`}
                  placeholder="e.g. CHR-402-BLK"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                />
                {formErrors.sku && <p className="text-red-500 text-xs mt-1">{formErrors.sku}</p>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Unit Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className={`form-control ${formErrors.price ? 'border-red-500' : ''}`}
                    placeholder="299.99"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                  {formErrors.price && <p className="text-red-500 text-xs mt-1">{formErrors.price}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label">Initial Quantity *</label>
                  <input
                    type="number"
                    className={`form-control ${formErrors.quantity ? 'border-red-500' : ''}`}
                    placeholder="10"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  />
                  {formErrors.quantity && <p className="text-red-500 text-xs mt-1">{formErrors.quantity}</p>}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditOpen && (
        <div className="modal-overlay" onClick={() => setIsEditOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Product Details</h3>
              <button className="modal-close" onClick={() => setIsEditOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input
                  type="text"
                  className={`form-control ${formErrors.name ? 'border-red-500' : ''}`}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
              </div>
              <div className="form-group">
                <label className="form-label">SKU/Code *</label>
                <input
                  type="text"
                  className={`form-control ${formErrors.sku ? 'border-red-500' : ''}`}
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                />
                {formErrors.sku && <p className="text-red-500 text-xs mt-1">{formErrors.sku}</p>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Unit Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className={`form-control ${formErrors.price ? 'border-red-500' : ''}`}
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                  {formErrors.price && <p className="text-red-500 text-xs mt-1">{formErrors.price}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label">Quantity in Stock *</label>
                  <input
                    type="number"
                    className={`form-control ${formErrors.quantity ? 'border-red-500' : ''}`}
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  />
                  {formErrors.quantity && <p className="text-red-500 text-xs mt-1">{formErrors.quantity}</p>}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmationModal
        isOpen={confirmDeleteOpen}
        title="Unregister Product?"
        message={`Are you sure you want to delete '${productToDelete?.name}' (SKU: ${productToDelete?.sku})? This will permanently remove this item from the catalog. Note that deletion may fail if the product is already linked to previous client orders.`}
        confirmText="Delete Catalog Item"
        cancelText="Keep in Catalog"
        onConfirm={handleDelete}
        onCancel={() => {
          setConfirmDeleteOpen(false);
          setProductToDelete(null);
        }}
        type="danger"
      />
    </div>
  );
};

export default Products;
