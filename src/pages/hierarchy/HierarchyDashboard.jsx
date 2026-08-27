import React, { useState, useEffect } from 'react';
import {
  Users, UserPlus, Shield, Star, Briefcase, Building, Store,
  UserCheck, Search, Filter, RefreshCw, Edit, Lock, Unlock,
  ShoppingBag, CheckCircle, AlertCircle, Phone, Mail, MapPin, ChevronRight, X
} from 'lucide-react';
import {
  getHierarchyUsers, getAllowedRoles, createHierarchyUser,
  updateHierarchyUser, getHierarchyStats, getHierarchyOrders
} from '../../services/api';
import RoleBadge, { ROLE_CONFIG } from '../../components/RoleBadge';

export default function HierarchyDashboard() {
  const [activeTab, setActiveTab] = useState('members'); // 'members', 'orders', 'tree'
  const [stats, setStats] = useState(null);
  const [usersData, setUsersData] = useState({ data: [], total: 0 });
  const [allowedRoles, setAllowedRoles] = useState([]);
  const [ordersData, setOrdersData] = useState({ data: [], total: 0 });
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    loadData();
  }, [search, selectedRole, selectedStatus]);

  useEffect(() => {
    if (activeTab === 'orders') loadOrders();
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-brand-blue-50 text-brand-blue-900 px-3 py-1 rounded-full text-xs font-bold mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>8-Tier Role Hierarchy &amp; Network Control</span>
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

      {/* 8-Tier Hierarchy Visual Ladder */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
            System Hierarchy Chain (Top-Down Governance)
          </h3>
          <span className="text-[11px] font-bold text-brand-blue-800">
            Each role can fully control and create all roles below it
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {hierarchyHierarchyFlow.map((h, i) => (
            <div
              key={h.key}
              className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-center flex flex-col items-center justify-center space-y-1 relative"
            >
              <span className="text-xl">{h.icon}</span>
              <span className="text-xs font-extrabold text-slate-800 truncate max-w-full">{h.label}</span>
              <span className="text-[10px] font-bold text-slate-400">Level {h.level}</span>
              {i < hierarchyHierarchyFlow.length - 1 && (
                <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-slate-300">
                  <ChevronRight className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

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
    </div>
  );
}
