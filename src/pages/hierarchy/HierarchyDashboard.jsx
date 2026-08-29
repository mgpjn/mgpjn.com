import React, { useState, useEffect } from 'react';
import {
  Users, UserPlus, Shield, Star, Briefcase, Building, Store,
  UserCheck, Search, Filter, RefreshCw, Edit, Lock, Unlock,
  ShoppingBag, CheckCircle, AlertCircle, Phone, Mail, MapPin, ChevronRight, X,
  Plus, FileText, Printer, Trash2
} from 'lucide-react';
import {
  getHierarchyUsers, getAllowedRoles, createHierarchyUser,
  updateHierarchyUser, getHierarchyStats, getHierarchyOrders,
  getPurchaseOrders, createPurchaseOrder, getProducts
} from '../../services/api';
import RoleBadge, { ROLE_CONFIG } from '../../components/RoleBadge';
import GstInvoiceModal from '../../components/invoice/GstInvoiceModal';
import { useAuth } from '../../context/AuthContext';

export default function HierarchyDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('members'); // 'members', 'orders', 'purchase-orders'
  const [stats, setStats] = useState(null);
  const [usersData, setUsersData] = useState({ data: [], total: 0 });
  const [allowedRoles, setAllowedRoles] = useState([]);
  const [ordersData, setOrdersData] = useState({ data: [], total: 0 });
  const [purchaseOrdersData, setPurchaseOrdersData] = useState({ data: [] });
  const [loading, setLoading] = useState(true);

  // PO States
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [poFormItems, setPoFormItems] = useState([{ product_id: '', requested_quantity: 10 }]);
  const [poNotes, setPoNotes] = useState('');
  const [poSubmitting, setPoSubmitting] = useState(false);
  const [selectedInvoiceOrderId, setSelectedInvoiceOrderId] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    pan_number: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    upi_id: '',
    status: 'active',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, rolesRes, usersRes] = await Promise.all([
        getHierarchyStats(),
        getAllowedRoles(),
        getHierarchyUsers({ search, role: selectedRole, status: selectedStatus, per_page: 20 }),
      ]);

      if (statsRes.data.success) setStats(statsRes.data);
      if (rolesRes.data.success) {
        setAllowedRoles(rolesRes.data.allowed_roles || []);
        if (rolesRes.data.allowed_roles.length > 0 && !formData.role) {
          setFormData((prev) => ({ ...prev, role: rolesRes.data.allowed_roles[0].key }));
        }
      }
      if (usersRes.data.success) setUsersData(usersRes.data.users || { data: [], total: 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const res = await getHierarchyOrders();
      if (res.data.success) setOrdersData(res.data.orders);
    } catch (err) {
      console.error(err);
    }
  };

  const loadPurchaseOrders = async () => {
    try {
      const res = await getPurchaseOrders();
      if (res.data.success) {
        setPurchaseOrdersData(res.data.purchase_orders || { data: res.data.purchase_orders || [] });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenPoModal = async () => {
    try {
      if (availableProducts.length === 0) {
        const prodRes = await getProducts({ per_page: 100 });
        if (prodRes.data.success) {
          setAvailableProducts(prodRes.data.products?.data || prodRes.data.data?.data || prodRes.data.data || []);
        }
      }
      setPoFormItems([{ product_id: '', requested_quantity: 10 }]);
      setPoNotes('');
      setIsPoModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePO = async (e) => {
    e.preventDefault();
    setPoSubmitting(true);
    try {
      const validItems = poFormItems.filter(it => it.product_id && it.requested_quantity > 0);
      if (validItems.length === 0) {
        alert('Please select at least one medicine item with quantity.');
        setPoSubmitting(false);
        return;
      }
      await createPurchaseOrder({
        items: validItems,
        notes: poNotes
      });
      alert('Purchase Order submitted successfully! Waiting for Super Admin approval.');
      setIsPoModalOpen(false);
      loadPurchaseOrders();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to submit Purchase Order');
    } finally {
      setPoSubmitting(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, selectedRole, selectedStatus]);

  useEffect(() => {
    if (activeTab === 'orders') loadOrders();
    if (activeTab === 'purchase-orders') loadPurchaseOrders();
  }, [activeTab]);

  const handleOpenAddModal = () => {
    setFormError('');
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: allowedRoles[0]?.key || 'retailer',
      address: '',
      city: '',
      state: '',
      pincode: '',
      pan_number: '',
      bank_name: '',
      account_number: '',
      ifsc_code: '',
      upi_id: '',
      status: 'active',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (user) => {
    setFormError('');
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      password: '',
      role: user.role || '',
      address: user.address || '',
      city: user.city || '',
      state: user.state || '',
      pincode: user.pincode || '',
      pan_number: user.pan_number || '',
      bank_name: user.bank_name || '',
      account_number: user.account_number || '',
      ifsc_code: user.ifsc_code || '',
      upi_id: user.upi_id || '',
      status: user.status || 'active',
    });
    setIsEditModalOpen(true);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      const res = await createHierarchyUser(formData);
      if (res.data.success) {
        setIsAddModalOpen(false);
        loadData();
      } else {
        setFormError(res.data.message || 'Failed to create member.');
      }
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Validation error.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSubmitting(true);
    setFormError('');
    try {
      const res = await updateHierarchyUser(selectedUser.id, formData);
      if (res.data.success) {
        setIsEditModalOpen(false);
        loadData();
      } else {
        setFormError(res.data.message || 'Failed to update member.');
      }
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Update failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleUserStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'blocked' : 'active';
    try {
      await updateHierarchyUser(user.id, { status: newStatus });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const hierarchyHierarchyFlow = [
    { key: 'super_admin', label: 'Super Admin', level: 8, icon: '👑' },
    { key: 'admin', label: 'Admin', level: 7, icon: '🛡️' },
    { key: 'super_distributor', label: 'Super Distributor', level: 6, icon: '🌟' },
    { key: 'distributor', label: 'Distributor', level: 5, icon: '💼' },
    { key: 'sub_distributor', label: 'Sub Distributor', level: 4, icon: '🏢' },
    { key: 'retailer', label: 'Retailer', level: 3, icon: '🏬' },
    { key: 'sub_retailer', label: 'Sub Retailer', level: 2, icon: '🛍️' },
    { key: 'customer', label: 'Customer', level: 1, icon: '👤' },
  ];

  const myLevel = user?.role
    ? (user.role === 'super_admin' ? 8 : user.role === 'admin' ? 7 : (ROLE_CONFIG[user.role]?.level || 2))
    : 8;
  const visibleHierarchyFlow = hierarchyHierarchyFlow.filter((h) => h.level < myLevel);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-brand-blue-50 text-brand-blue-900 px-3 py-1 rounded-full text-xs font-bold mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Downline Network &amp; Subordinate Team Control</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Team &amp; Downline Hierarchy Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your subordinate team roles, add distributors, chemists, sub-retailers, and monitor sales volume.
          </p>
        </div>

        {allowedRoles.length > 0 && (
          <button
            onClick={handleOpenAddModal}
            className="bg-brand-orange-500 hover:bg-brand-orange-600 text-white px-5 py-3 rounded-2xl text-xs font-bold flex items-center space-x-2 shadow-lg shadow-brand-orange-500/20 transition-all hover:scale-105"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add Subordinate Member</span>
          </button>
        )}
      </div>

      {/* Downline Subordinate Hierarchy Visual Ladder */}
      {visibleHierarchyFlow.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
              Subordinate Roles Below Your Post ({user?.role ? user.role.replace(/_/g, ' ').toUpperCase() : 'MEMBER'})
            </h3>
            <span className="text-[11px] font-bold text-brand-blue-800">
              Only roles strictly below your position are manageable
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {visibleHierarchyFlow.map((h, i) => (
              <div
                key={h.key}
                className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-center flex flex-col items-center justify-center space-y-1 relative"
              >
                <span className="text-xl">{h.icon}</span>
                <span className="text-xs font-extrabold text-slate-800 truncate max-w-full">{h.label}</span>
                <span className="text-[10px] font-bold text-slate-400">Level {h.level}</span>
                {i < visibleHierarchyFlow.length - 1 && (
                  <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-slate-300">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400">Downline Team Members</p>
              <h3 className="text-2xl font-black text-slate-900">{stats.total_team_members}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400">Downline Sales Volume</p>
              <h3 className="text-2xl font-black text-slate-900">₹{stats.total_sales.toLocaleString('en-IN')}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400">Total Refer &amp; Earn Payout</p>
              <h3 className="text-2xl font-black text-slate-900">₹{stats.total_earned.toLocaleString('en-IN')}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400">Current Wallet Balance</p>
              <h3 className="text-2xl font-black text-brand-blue-800">₹{stats.wallet_balance.toLocaleString('en-IN')}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'members'
              ? 'bg-brand-blue-800 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Manageable Members ({usersData.total || 0})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'orders'
              ? 'bg-brand-blue-800 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Downline Network Orders
        </button>
        <button
          onClick={() => setActiveTab('purchase-orders')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'purchase-orders'
              ? 'bg-brand-blue-800 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Medicine Purchase Orders (PO)
        </button>
      </div>

      {activeTab === 'members' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, phone, code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-blue-600"
              />
            </div>

            <div className="flex items-center space-x-3 w-full md:w-auto">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
              >
                <option value="all">All Roles</option>
                {allowedRoles.map((r) => (
                  <option key={r.key} value={r.key}>{r.label}</option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
                <option value="inactive">Inactive</option>
              </select>

              <button
                onClick={loadData}
                className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Members Table */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-3.5 px-4">Member Info</th>
                    <th className="py-3.5 px-4">Role Tier</th>
                    <th className="py-3.5 px-4">Referral ID</th>
                    <th className="py-3.5 px-4">Upline / Sponsor</th>
                    <th className="py-3.5 px-4">Location</th>
                    <th className="py-3.5 px-4">Wallet Balance</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="text-center py-10 text-slate-400">Loading downline hierarchy...</td>
                    </tr>
                  ) : usersData.data.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-10 text-slate-400">
                        No team members found. Click "+ Add Subordinate Member" to register downlines.
                      </td>
                    </tr>
                  ) : (
                    usersData.data.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-extrabold text-slate-900">{u.name}</div>
                            <div className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                              <Phone className="w-3 h-3" />
                              <span>{u.phone}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <RoleBadge role={u.role} />
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-brand-blue-800 bg-brand-blue-50 px-2 py-0.5 rounded-md">
                            {u.referral_code}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {u.sponsor ? (
                            <div>
                              <span className="font-semibold text-slate-800">{u.sponsor.name}</span>
                              <span className="text-[10px] text-slate-400 block font-mono">({u.sponsor.referral_code})</span>
                            </div>
                          ) : (
                            <span className="text-slate-400">Direct / Head Office</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {u.city ? `${u.city}, ${u.state || ''}` : 'India'}
                        </td>
                        <td className="py-3 px-4 font-black text-slate-900">
                          ₹{(u.wallet_balance || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {u.status?.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleOpenEditModal(u)}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-brand-blue-50 hover:text-brand-blue-800 transition-colors"
                              title="Edit Member"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => toggleUserStatus(u)}
                              className={`p-1.5 rounded-lg border transition-colors ${
                                u.status === 'active'
                                  ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                                  : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={u.status === 'active' ? 'Block Access' : 'Activate Member'}
                            >
                              {u.status === 'active' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900">Downline Network Orders</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Customer / Partner</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ordersData.data && ordersData.data.length > 0 ? (
                  ordersData.data.map((ord) => (
                    <tr key={ord.id}>
                      <td className="py-3 px-4 font-mono font-bold text-brand-blue-800">#{ord.order_number}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{ord.customer_name} ({ord.phone})</td>
                      <td className="py-3 px-4"><RoleBadge role={ord.user?.role || 'customer'} size="small" /></td>
                      <td className="py-3 px-4 font-bold text-slate-900">₹{ord.total_amount}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-bold text-[10px]">
                          {ord.order_status?.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{new Date(ord.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-400">No downline orders placed yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PURCHASE ORDERS TAB */}
      {activeTab === 'purchase-orders' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Medicine Purchase Orders (PO)</h3>
              <p className="text-xs text-slate-500">
                Submit bulk medicine stock requests to Super Admin with state wholesale rates. Approved POs generate official GST Tax Invoices.
              </p>
            </div>
            <button
              onClick={handleOpenPoModal}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Medicine PO</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-4">Medicines</th>
                  <th className="py-3 px-4">State Wholesale Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Submission Date</th>
                  <th className="py-3 px-4 text-right">Invoice &amp; Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchaseOrdersData?.data && purchaseOrdersData.data.length > 0 ? (
                  purchaseOrdersData.data.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-mono font-bold text-brand-orange-500">
                        {po.po_number}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800 block">
                          {po.items?.length || 0} Products Requested
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {po.items?.map(it => `${it.product?.name} (${po.status === 'approved' ? it.approved_quantity : it.requested_quantity})`).join(', ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-black text-slate-900">
                        ₹{Number(po.total_amount || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] capitalize ${
                          po.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                          po.status === 'rejected' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {po.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(po.created_at).toLocaleDateString('en-GB')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {po.order_id ? (
                          <button
                            onClick={() => setSelectedInvoiceOrderId(po.order_id)}
                            className="bg-brand-orange-50 hover:bg-brand-orange-100 text-brand-orange-600 border border-brand-orange-200 px-3 py-1.5 rounded-xl font-bold text-xs inline-flex items-center space-x-1 cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Tax Invoice</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Pending Approval</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-400">
                      No Purchase Orders submitted yet. Click "+ Create Medicine PO" to request inventory.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE MEMBER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-brand-orange-500" />
                <h3 className="font-black text-slate-900 text-base">Register Subordinate Member</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Hierarchy Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-semibold text-brand-blue-800 bg-brand-blue-50/50 focus:outline-none focus:border-brand-blue-600"
                    required
                  >
                    {allowedRoles.map((r) => (
                      <option key={r.key} value={r.key}>{r.label} (Level {r.level})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Full Name / Agency Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Health Agency"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mobile Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="10-digit mobile"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="agency@gmail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">City / Region</label>
                  <input
                    type="text"
                    placeholder="e.g. Delhi NCR"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-brand-orange-500 text-white rounded-xl font-bold hover:bg-brand-orange-600 shadow-md shadow-brand-orange-500/20"
                >
                  {submitting ? 'Creating...' : 'Register & Grant Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MEMBER MODAL */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-slate-900 text-base">Edit {selectedUser.name}</h3>
                <span className="text-[11px] font-mono text-slate-400">ID: {selectedUser.referral_code}</span>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Hierarchy Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-semibold text-brand-blue-800"
                  >
                    {allowedRoles.map((r) => (
                      <option key={r.key} value={r.key}>{r.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Account Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-bold"
                  >
                    <option value="active">Active</option>
                    <option value="blocked">Blocked / Suspended</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Reset Password (Optional)</label>
                  <input
                    type="password"
                    placeholder="Leave blank to keep same"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-brand-blue-800 text-white rounded-xl font-bold hover:bg-brand-blue-900 shadow-md"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE PURCHASE ORDER MODAL */}
      {isPoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-slate-900 text-base">Submit Medicine Purchase Order (PO)</h3>
              </div>
              <button onClick={() => setIsPoModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePO} className="space-y-4 text-xs">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl text-[11px] text-blue-900">
                <span className="font-bold block">📦 Bulk Medicine Ordering System</span>
                <span>Select medicines and requested quantities. Super Admin will verify stock availability and approve batch quantities with state wholesale pricing.</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">Requested Medicines</label>
                  <button
                    type="button"
                    onClick={() => setPoFormItems([...poFormItems, { product_id: '', requested_quantity: 10 }])}
                    className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Medicine</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto p-1">
                  {poFormItems.map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                      <select
                        required
                        value={item.product_id}
                        onChange={(e) => {
                          const updated = [...poFormItems];
                          updated[idx].product_id = e.target.value;
                          setPoFormItems(updated);
                        }}
                        className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg font-semibold text-slate-800"
                      >
                        <option value="">Select Medicine</option>
                        {availableProducts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.box_packing || p.strip_packing || 'Standard Pack'})
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center space-x-1 w-32">
                        <input
                          type="number"
                          min="1"
                          required
                          placeholder="Qty"
                          value={item.requested_quantity}
                          onChange={(e) => {
                            const updated = [...poFormItems];
                            updated[idx].requested_quantity = parseInt(e.target.value) || 0;
                            setPoFormItems(updated);
                          }}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-center font-bold text-slate-900"
                        />
                      </div>

                      {poFormItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setPoFormItems(poFormItems.filter((_, i) => i !== idx))}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Dispatch / Order Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Urgent stock replenishment for pharmacy hub"
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsPoModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={poSubmitting}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md"
                >
                  {poSubmitting ? 'Submitting PO...' : 'Submit PO to Super Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GST Invoice Modal */}
      {selectedInvoiceOrderId && (
        <GstInvoiceModal
          orderId={selectedInvoiceOrderId}
          onClose={() => setSelectedInvoiceOrderId(null)}
        />
      )}
    </div>
  );
}
