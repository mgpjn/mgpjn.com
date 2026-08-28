import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserCheck, UserPlus, Store, Users2,
  Calculator, ArrowLeftRight, FileSpreadsheet, Package, FolderTree,
  ShoppingCart, Wallet, Image, BarChart3, ShieldCheck, Settings,
  LogOut, Plus, Search, RefreshCw, Eye, EyeOff, Edit, Trash2,
  CheckCircle2, XCircle, ArrowUpRight, Printer, Tag, Bell,
  ChevronDown, ChevronRight, Filter, AlertCircle, Check, X, Shield,
  Layers, Lock, ExternalLink, Calendar, DollarSign, ArrowRight, MapPin,
  User, UserCheck2, UserPlus2, FileCheck, KeyRound, ShieldAlert,
  CheckCheck, SlidersHorizontal, ArrowDownCircle, Map, Upload
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getAdminStats,
  getAdminUsersByRole, storeAdminHierarchyUser, updateAdminHierarchyUser, impersonateAdminUser,
  resetAdminUserPassword, toggleAdminUserStatus, transferAdminUser, approveAdminUser, rejectAdminUser,
  getAdminMargins, updateAdminMargins,
  getAdminTransfers, createAdminTransfer,
  getAdminProductMargins,
  getAdminCategories, storeAdminCategory, updateAdminCategory, deleteAdminCategory,
  getAdminProducts, storeAdminProduct, updateAdminProduct, deleteAdminProduct,
  uploadAdminProductImage,
  getAdminProductStatePrices, saveAdminProductStatePrices,
  getAdminOrders, updateAdminOrderStatus,
  getPurchaseOrders, approvePurchaseOrder, rejectPurchaseOrder,
  getAdminPrescriptions, updateAdminPrescriptionStatus,
  getAdminPayouts, processAdminPayout,
  getAdminBanners, storeAdminBanner, deleteAdminBanner,
  getAdminReports,
  getAdminEmployees, storeAdminEmployee, updateAdminEmployee,
  getAdminSettings, updateAdminSettings
} from '../../services/api';
import GstInvoiceModal from '../../components/invoice/GstInvoiceModal';

const INDIAN_STATES = [
  "ANDAMAN & NICOBAR", "ANDHRA PRADESH", "ARUNACHAL PRADESH", "ASSAM", "BIHAR",
  "CHANDIGARH", "CHATTISGARH", "DADRA & NAGAR", "DAMAN & DIU", "DELHI", "GOA",
  "GUJRAT", "HARYANA", "HIMACHAL PRADESH", "JAMMU & KASHMIR", "JHARKHAND",
  "KARNATAKA", "KERALA", "LAKSHDWEEP", "MADHYA PRADESH", "MAHARASHTRA",
  "MANIPUR", "MEGHALAYA", "MIZORAM", "NAGALAND", "ODISHA", "PUDUCHERRY",
  "PUNJAB", "RAJASTHAN", "SIKKIM", "TAMIL NADU", "TELANGANA", "TRIPURA",
  "UTTAR PRADESH", "UTTARAKHAND", "WEST BENGAL"
];

const PACKAGING_UNITS = [
  "Tablet", "Capsule", "Strip", "Blister", "Box", "Carton", "Master Carton",
  "Vial", "Ampoule", "Pre-filled Syringe", "Piece", "mL (Millilitre)", "Bottle",
  "Jar", "Sachet", "Pouch", "Packet", "Gram (g)", "Tube", "Kit", "Set",
  "Pack", "Piece (Pcs)", "Dozen"
];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const pathParts = location.pathname.split('/');
  const currentSection = pathParts[2] || 'dashboard';

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Role Users State
  const [roleUsers, setRoleUsers] = useState({ data: [] });
  const [roleStats, setRoleStats] = useState({ total: 0, active: 0, pending: 0, inactive: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    name: '',
    business_name: '',
    email: '',
    mobile: '',
    phone: '',
    password: '',
    role: 'super_distributor',
    sponsor_code: '',
    address: '',
    state: 'GUJRAT',
    city: 'Surat',
    pincode: '394230',
    pan_number: '',
    gst_number: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    upi_id: '',
    status: 'active',
  });

  // Margins
  const [margins, setMargins] = useState({});
  const [savingMargins, setSavingMargins] = useState(false);

  // Transfers
  const [transfersList, setTransfersList] = useState({ data: [] });
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferMode, setTransferMode] = useState('tree_migration'); // 'tree_migration' or 'wallet_transfer'
  const [transferForm, setTransferForm] = useState({
    current_level: 'Super Distributor',
    user_id: '',
    new_parent_id: '',
    receiver_code: '',
    amount: '',
    transfer_type: 'admin_credit',
    reason: '',
    notes: '',
  });

  // Product Margins
  const [productMarginsList, setProductMarginsList] = useState({ data: [] });

  // Products
  const [productsList, setProductsList] = useState({ data: [] });
  const [categoriesList, setCategoriesList] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    subtitle: '',
    category_id: '',
    sub_category_id: '',
    batch_no: '',
    manufacturer: 'MEDIGLAXO PHARMA',
    description: '',
    mrp: '',
    base_price: '',
    stock_quantity: 100,
    box_packing: '1 Box (10 Strips)',
    box_unit: 'Box',
    strip_packing: '1 Strip (10 Tablets)',
    strip_unit: 'Strip',
    expiry_date: '',
    status: 'Active',
    image: '',
  });

  // Categories
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    parent_id: '',
    icon: '',
    image: '',
    description: '',
    sort_order: 0,
    is_active: true,
  });

  // Orders & Payouts
  const [ordersList, setOrdersList] = useState({ data: [] });
  const [payoutsList, setPayoutsList] = useState({ data: [] });
  const [selectedInvoiceOrderId, setSelectedInvoiceOrderId] = useState(null);

  // Banners & Reports
  const [bannersList, setBannersList] = useState([]);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [bannerForm, setBannerForm] = useState({
    title: '',
    subtitle: '',
    image: '',
    link: '/shop',
    position: 'hero',
    sort_order: 1,
    is_active: true,
  });
  const [reportsData, setReportsData] = useState(null);

  // Employees & Role Permissions
  const [employeesList, setEmployeesList] = useState([]);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    department: 'Operations',
    role: 'admin',
    permissions: {
      dashboard: true,
      super_distributors: true,
      distributors: true,
      sub_distributors: true,
      retailers: true,
      user_customer: true,
      margins: false,
      transfers: false,
      product_margins: true,
      products: true,
      categories: true,
      orders: true,
      wallet: false,
      banners: true,
      reports: true,
      employees: false,
      settings: false,
    },
  });

  // Settings
  const [settingsData, setSettingsData] = useState({
    company_name: 'MEDIGLAXO PHARMA',
    gstin: '24ABVFM0075D1ZA',
    helpline: '+91 9650582703',
    support_email: 'support@mediglaxo.com',
    min_payout: '500',
    free_shipping_min: '500',
    delivery_charge: '50',
  });

  // State Filter & State Counts
  const [stateFilter, setStateFilter] = useState('all');
  const [stateCounts, setStateCounts] = useState({});

  // Super Admin Password Reset Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordTargetUser, setPasswordTargetUser] = useState(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  // Super Admin Move / Transfer Modal
  const [showTransferUserModal, setShowTransferUserModal] = useState(false);
  const [transferTargetUser, setTransferTargetUser] = useState(null);
  const [transferUserForm, setTransferUserForm] = useState({
    new_sponsor_code: '',
    new_state: 'GUJRAT',
    new_city: 'Surat',
    new_pincode: '394230',
  });

  // State-Wise Wholesale Pricing Modal
  const [showStatePriceModal, setShowStatePriceModal] = useState(false);
  const [statePriceProduct, setStatePriceProduct] = useState(null);
  const [statePriceRows, setStatePriceRows] = useState([]);

  // Medicine Purchase Orders (PO)
  const [purchaseOrdersList, setPurchaseOrdersList] = useState({ data: [] });
  const [selectedPO, setSelectedPO] = useState(null);
  const [showPOModal, setShowPOModal] = useState(false);
  const [poApprovalQuantities, setPoApprovalQuantities] = useState({});
  const [poAdminNotes, setPoAdminNotes] = useState('');

  const menuItems = [
    { key: 'dashboard', label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { key: 'super-distributors', label: 'Super Distributors', path: '/admin/super-distributors', icon: Users, roleType: 'super_distributor' },
    { key: 'distributors', label: 'Distributors', path: '/admin/distributors', icon: UserCheck, roleType: 'distributor' },
    { key: 'sub-distributors', label: 'Sub Distributors', path: '/admin/sub-distributors', icon: UserPlus, roleType: 'sub_distributor' },
    { key: 'retailers', label: 'Retailers (Chemist)', path: '/admin/retailers', icon: Store, roleType: 'retailer' },
    { key: 'sub-retailers', label: 'Sub Retailers (Pincode & Local)', path: '/admin/sub-retailers', icon: MapPin, roleType: 'sub_retailer' },
    { key: 'customer-layer-1', label: 'Customer 1', path: '/admin/customer-layer-1', icon: User, roleType: 'customer_layer_1' },
    { key: 'customer-layer-2', label: 'Customer 2', path: '/admin/customer-layer-2', icon: UserCheck2, roleType: 'customer_layer_2' },
    { key: 'customer-layer-3', label: 'Customer 3', path: '/admin/customer-layer-3', icon: UserPlus2, roleType: 'customer_layer_3' },
    { key: 'user_customer', label: 'All Customers (Directory)', path: '/admin/user_customer', icon: Users2, roleType: 'customer' },
    { key: 'purchase-orders', label: 'Medicine PO Approvals', path: '/admin/purchase-orders', icon: FileCheck },
    { key: 'margins', label: 'Margin Management', path: '/admin/margins', icon: Calculator },
    { key: 'transfers', label: 'Transfer Management', path: '/admin/transfers', icon: ArrowLeftRight },
    { key: 'product-margins', label: 'Product Margin List', path: '/admin/product-margins', icon: FileSpreadsheet },
    { key: 'products', label: 'Products', path: '/admin/products', icon: Package },
    { key: 'categories', label: 'Categories', path: '/admin/categories', icon: FolderTree },
    { key: 'orders', label: 'Orders', path: '/admin/orders', icon: ShoppingCart },
    { key: 'wallet', label: 'Commission Wallet', path: '/admin/wallet', icon: Wallet },
    { key: 'banners', label: 'Banner Management', path: '/admin/banners', icon: Image },
    { key: 'reports', label: 'Reports', path: '/admin/reports', icon: BarChart3 },
    { key: 'employees', label: 'Employee Module', path: '/admin/employees', icon: ShieldCheck },
    { key: 'settings', label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const NETWORK_ROLE_SECTIONS = [
    'super-distributors',
    'distributors',
    'sub-distributors',
    'retailers',
    'sub-retailers',
    'customer-layer-1',
    'customer-layer-2',
    'customer-layer-3',
    'all-customers',
    'user_customer'
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      if (currentSection === 'dashboard' || currentSection === '') {
        const [statsRes, prodRes] = await Promise.all([getAdminStats(), getAdminProducts()]);
        if (statsRes.data.success) setStats(statsRes.data.stats);
        if (prodRes.data.success) setProductsList(prodRes.data.products);
      } else if (NETWORK_ROLE_SECTIONS.includes(currentSection)) {
        const item = menuItems.find(m => m.key === currentSection);
        const role = item?.roleType || (currentSection === 'all-customers' ? 'customer' : 'super_distributor');
        const res = await getAdminUsersByRole({ role, search: searchQuery, status: statusFilter, state: stateFilter, sort: sortOrder });
        if (res.data.success) {
          setRoleUsers(res.data.users);
          setRoleStats(res.data.stats);
          if (res.data.state_counts) setStateCounts(res.data.state_counts);
        }
      } else if (currentSection === 'purchase-orders') {
        const res = await getPurchaseOrders({ status: statusFilter, state: stateFilter });
        if (res.data.success) setPurchaseOrdersList(res.data.purchase_orders);
      } else if (currentSection === 'margins') {
        const res = await getAdminMargins();
        if (res.data.success) setMargins(res.data.margins);
      } else if (currentSection === 'transfers') {
        const [trfRes, usersRes] = await Promise.all([getAdminTransfers(), getAdminUsersByRole({ role: 'all' })]);
        if (trfRes.data.success) setTransfersList(trfRes.data.transfers);
        if (usersRes.data.success) setRoleUsers(usersRes.data.users);
      } else if (currentSection === 'product-margins') {
        const res = await getAdminProductMargins();
        if (res.data.success) setProductMarginsList(res.data.products);
      } else if (currentSection === 'products') {
        const [prodRes, catRes] = await Promise.all([getAdminProducts(), getAdminCategories()]);
        if (prodRes.data.success) setProductsList(prodRes.data.products);
        if (catRes.data.success) setCategoriesList(catRes.data.categories);
      } else if (currentSection === 'categories') {
        const res = await getAdminCategories();
        if (res.data.success) setCategoriesList(res.data.categories);
      } else if (currentSection === 'orders') {
        const res = await getAdminOrders();
        if (res.data.success) setOrdersList(res.data.orders);
      } else if (currentSection === 'wallet') {
        const res = await getAdminPayouts();
        if (res.data.success) setPayoutsList(res.data.payouts);
      } else if (currentSection === 'banners') {
        const res = await getAdminBanners();
        if (res.data.success) setBannersList(res.data.banners);
      } else if (currentSection === 'reports') {
        const res = await getAdminReports();
        if (res.data.success) setReportsData(res.data.reports);
      } else if (currentSection === 'employees') {
        const res = await getAdminEmployees();
        if (res.data.success) setEmployeesList(res.data.employees);
      } else if (currentSection === 'settings') {
        const res = await getAdminSettings();
        if (res.data.success && res.data.settings) {
          setSettingsData(prev => ({ ...prev, ...res.data.settings }));
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentSection, statusFilter, sortOrder, stateFilter]);

  // Super Admin: Password Reset
  const handleOpenPasswordModal = (targetUser) => {
    setPasswordTargetUser(targetUser);
    setNewPasswordInput('');
    setShowPasswordModal(true);
  };

  const handlePasswordResetSubmit = async (e) => {
    e.preventDefault();
    if (!passwordTargetUser || !newPasswordInput) return;
    try {
      const res = await resetAdminUserPassword(passwordTargetUser.id, { password: newPasswordInput });
      if (res.data.success) {
        alert(`Success: ${res.data.message}`);
        setShowPasswordModal(false);
      }
    } catch (err) {
      alert(`Failed to reset password: ${err.response?.data?.message || err.message}`);
    }
  };

  // Super Admin: Toggle Status (Active / Inactive)
  const handleToggleUserStatus = async (userId, targetStatus) => {
    try {
      const res = await toggleAdminUserStatus(userId, { status: targetStatus });
      if (res.data.success) {
        alert(res.data.message);
        fetchData();
      }
    } catch (err) {
      alert(`Error updating status: ${err.response?.data?.message || err.message}`);
    }
  };

  // Super Admin: Move / Transfer User
  const handleOpenTransferModal = (targetUser) => {
    setTransferTargetUser(targetUser);
    setTransferUserForm({
      new_sponsor_code: targetUser.sponsor?.referral_code || '',
      new_state: targetUser.state || 'GUJRAT',
      new_city: targetUser.city || 'Surat',
      new_pincode: targetUser.pincode || '394230',
    });
    setShowTransferUserModal(true);
  };

  const handleTransferUserSubmit = async (e) => {
    e.preventDefault();
    if (!transferTargetUser) return;
    try {
      const res = await transferAdminUser(transferTargetUser.id, transferUserForm);
      if (res.data.success) {
        alert(`Success: ${res.data.message}`);
        setShowTransferUserModal(false);
        fetchData();
      }
    } catch (err) {
      alert(`Transfer failed: ${err.response?.data?.message || err.message}`);
    }
  };

  // Super Admin: Approve Pending Sub-Retailer / Downline Registration
  const handleApproveUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to verify and APPROVE registration for ${userName}?`)) return;
    try {
      const res = await approveAdminUser(userId);
      if (res.data.success) {
        alert(`Success: ${res.data.message}`);
        fetchData();
      }
    } catch (err) {
      alert(`Approval error: ${err.response?.data?.message || err.message}`);
    }
  };

  // Super Admin: Reject Registration
  const handleRejectUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to REJECT registration for ${userName}?`)) return;
    try {
      const res = await rejectAdminUser(userId, { reason: 'Rejected by Super Admin after review' });
      if (res.data.success) {
        alert(`Success: ${res.data.message}`);
        fetchData();
      }
    } catch (err) {
      alert(`Rejection error: ${err.response?.data?.message || err.message}`);
    }
  };

  // Super Admin: State-Wise Wholesale Pricing Modal
  const handleOpenStatePriceModal = async (prod) => {
    setStatePriceProduct(prod);
    try {
      const res = await getAdminProductStatePrices(prod.id);
      if (res.data.success) {
        const existing = res.data.state_prices || [];
        const baseWholesale = Number(prod.wholesale_price || (prod.price * 0.6));
        const rows = INDIAN_STATES.map(st => {
          const found = existing.find(p => p.state?.toUpperCase() === st.toUpperCase());
          return {
            state: st,
            wholesale_price: found ? found.wholesale_price : baseWholesale,
            retail_price: found ? found.retail_price : prod.price,
            mrp: found ? found.mrp : prod.mrp,
          };
        });
        setStatePriceRows(rows);
        setShowStatePriceModal(true);
      }
    } catch (err) {
      console.error('Error fetching state prices:', err);
    }
  };

  const handleSaveStatePricesSubmit = async (e) => {
    e.preventDefault();
    if (!statePriceProduct) return;
    try {
      const res = await saveAdminProductStatePrices(statePriceProduct.id, { prices: statePriceRows });
      if (res.data.success) {
        alert(`State wholesale rates saved successfully for ${statePriceProduct.name}!`);
        setShowStatePriceModal(false);
      }
    } catch (err) {
      alert(`Error saving state prices: ${err.response?.data?.message || err.message}`);
    }
  };

  // Super Admin: Medicine Purchase Order (PO) Review & Approval
  const handleOpenPOModal = (po) => {
    setSelectedPO(po);
    const qtys = {};
    po.items?.forEach(item => {
      qtys[item.id] = item.approved_quantity > 0 ? item.approved_quantity : item.requested_quantity;
    });
    setPoApprovalQuantities(qtys);
    setPoAdminNotes(po.admin_notes || '');
    setShowPOModal(true);
  };

  const handleApprovePOSubmit = async () => {
    if (!selectedPO) return;
    const itemsPayload = selectedPO.items?.map(item => ({
      id: item.id,
      approved_quantity: Number(poApprovalQuantities[item.id] !== undefined ? poApprovalQuantities[item.id] : item.requested_quantity)
    }));

    try {
      const res = await approvePurchaseOrder(selectedPO.id, {
        items: itemsPayload,
        admin_notes: poAdminNotes
      });
      if (res.data.success) {
        alert(`Purchase Order #${selectedPO.po_number} APPROVED!\nGST Tax Invoice Generated.`);
        setShowPOModal(false);
        fetchData();
      }
    } catch (err) {
      alert(`Error approving PO: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleRejectPOSubmit = async () => {
    if (!selectedPO) return;
    if (!window.confirm(`Reject Purchase Order #${selectedPO.po_number}?`)) return;
    try {
      const res = await rejectPurchaseOrder(selectedPO.id, { admin_notes: poAdminNotes });
      if (res.data.success) {
        alert(`Purchase Order #${selectedPO.po_number} marked as Rejected.`);
        setShowPOModal(false);
        fetchData();
      }
    } catch (err) {
      alert(`Error rejecting PO: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  const handleResetSearch = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSortOrder('newest');
  };

  // Partner & Customer CRUD
  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...userForm };
      if (payload.role && payload.role.startsWith('customer')) {
        payload.role = 'customer';
      }
      if (editingUser) {
        await updateAdminHierarchyUser(editingUser.id, payload);
      } else {
        await storeAdminHierarchyUser(payload);
      }
      setShowAddUserModal(false);
      setEditingUser(null);
      fetchData();
    } catch (err) {
      alert('Failed to save user. Verify details.');
    }
  };

  const handleImpersonate = async (userId) => {
    if (window.confirm('Log in directly to this partner/customer account as Super Admin?')) {
      try {
        const res = await impersonateAdminUser(userId);
        if (res.data.success) {
          localStorage.setItem('mediglaxo_token', res.data.token);
          localStorage.setItem('mediglaxo_user', JSON.stringify(res.data.user));
          const targetRole = res.data.user?.role;
          const dest = targetRole === 'customer' ? '/my-orders' :
                       (targetRole === 'sub_retailer' || targetRole === 'member') ? '/mlm' :
                       '/hierarchy';
          window.location.href = dest;
        }
      } catch (err) {
        alert('Impersonation failed.');
      }
    }
  };

  // Product Image Upload
  const [uploadingProductImage, setUploadingProductImage] = useState(false);

  const handleProductImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingProductImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await uploadAdminProductImage(formData);
      if (res.data.success) {
        setProductForm(prev => ({ ...prev, image: res.data.url }));
      }
    } catch (err) {
      alert(`Image upload failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setUploadingProductImage(false);
    }
  };

  // Product CRUD
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await updateAdminProduct(editingProduct.id, productForm);
      } else {
        await storeAdminProduct(productForm);
      }
      setShowProductModal(false);
      setEditingProduct(null);
      fetchData();
      alert('Product saved successfully!');
    } catch (err) {
      alert('Failed to save product. Check required fields.');
    }
  };

  // Transfer Submit
  const handleSaveTransfer = async (e) => {
    e.preventDefault();
    try {
      await createAdminTransfer(transferForm);
      setShowTransferModal(false);
      setTransferForm({
        current_level: 'Super Distributor',
        user_id: '',
        new_parent_id: '',
        receiver_code: '',
        amount: '',
        transfer_type: 'admin_credit',
        reason: '',
        notes: '',
      });
      fetchData();
      alert('Transfer processed successfully.');
    } catch (err) {
      alert('Transfer failed. Check inputs.');
    }
  };

  const currentMenuItem = menuItems.find(m => m.key === currentSection) || menuItems[0];
  const sectionTitle = currentMenuItem.label;

  const selectedCatObj = categoriesList.find(c => c.id === parseInt(productForm.category_id));
  const availableSubCats = selectedCatObj?.children || [];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* 1. LEFT ADMIN SIDEBAR (MATCHING SCREENSHOT & LIVE mgpjn.com) */}
      <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between flex-shrink-0 z-30 shadow-xs">
        <div>
          {/* Logo Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/logo.png" alt="MediGlaxo" className="h-9 w-auto" />
            </Link>
          </div>

          {/* Admin User Profile Card (Matching Live Blue Gradient Card) */}
          <div className="m-3 p-3.5 rounded-2xl bg-gradient-to-r from-[#2196f3] to-[#1976d2] text-white shadow-sm flex items-center space-x-3">
            <div className="w-11 h-11 rounded-full bg-white text-[#ff5722] flex items-center justify-center font-black text-xl shadow-xs flex-shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="overflow-hidden">
              <h4 className="font-black text-sm text-white truncate">{user?.name || 'Admin'}</h4>
              <p className="text-[11px] text-blue-100/90 leading-tight">N/A</p>
              <p className="text-[11px] text-blue-100/90 capitalize leading-tight">{user?.role || 'Admin'}</p>
            </div>
          </div>

          {/* 17 Sidebar Menu Items */}
          <nav className="p-2.5 space-y-1 max-h-[calc(100vh-230px)] overflow-y-auto text-xs font-semibold">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentSection === item.key || (currentSection === '' && item.key === 'dashboard');

              return (
                <button
                  key={item.key}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all text-left ${
                    isActive
                      ? 'bg-[#ff5722] text-white font-bold shadow-md shadow-[#ff5722]/20'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Logout Button */}
        <div className="p-3 border-t border-slate-100">
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN ADMIN CONTENT WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900">
              Super Admin Dashboard
            </h1>
          </div>

          <div className="flex items-center space-x-4 text-slate-600">
            <div className="relative p-2 rounded-lg hover:bg-slate-100 cursor-pointer">
              <ShoppingCart className="w-5 h-5 text-slate-600" />
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#ff5722] text-white text-[9px] font-black rounded-full flex items-center justify-center">
                0
              </span>
            </div>

            <div className="relative p-2 rounded-lg hover:bg-slate-100 cursor-pointer">
              <Bell className="w-5 h-5 text-slate-600" />
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#ff5722] text-white text-[9px] font-black rounded-full flex items-center justify-center">
                0
              </span>
            </div>

            <div className="flex items-center space-x-1 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-[#ff5722] text-white flex items-center justify-center font-bold text-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* ======================================================== */}
          {/* 1. DASHBOARD OVERVIEW (MATCHING LIVE mgpjn.com EXACTLY)  */}
          {/* ======================================================== */}
          {currentSection === 'dashboard' && (
            <div className="space-y-6">
              {/* Top 2 Live Product Cards (Left: Recent Products, Right: Low Stock Alert) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Recent Products Card */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-3.5">
                  <div className="flex items-center justify-between pb-1">
                    <h3 className="font-black text-slate-900 text-sm">Recent Pharmaceutical Products</h3>
                    <Link to="/admin/products" className="text-xs font-bold text-[#ff5722] hover:underline flex items-center space-x-1">
                      <span>View All</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="space-y-2.5">
                    {productsList?.data?.slice(0, 3).map((p, idx) => (
                      <div key={p.id || idx} className="p-3.5 bg-[#fbfcfd] hover:bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between transition-colors">
                        <div className="flex items-center space-x-3.5 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs flex-shrink-0 ${
                            idx === 0 ? 'bg-gradient-to-br from-slate-700 to-slate-900 text-white' :
                            idx === 1 ? 'bg-gradient-to-br from-orange-600 to-amber-700 text-white' :
                            'bg-gradient-to-br from-blue-700 to-indigo-900 text-white'
                          }`}>
                            <Package className="w-5 h-5" />
                          </div>
                          <div className="truncate">
                            <h4 className="font-bold text-xs text-slate-900 truncate">{p.name}</h4>
                            <span className="text-[11px] text-slate-400 font-medium">{p.category?.name || 'Injections'}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 pl-3">
                          <div className="text-sm font-black text-[#ff5722]">₹{parseFloat(p.retail_price || p.price || 24).toFixed(2)}</div>
                          <div className="text-[10px] text-slate-400 font-medium">Stock: {p.stock || 0}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Low Stock Alert Card */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-3.5">
                  <div className="flex items-center justify-between pb-1">
                    <h3 className="font-black text-slate-900 text-sm">Low Stock Alerts</h3>
                    <Link to="/admin/products" className="text-xs font-bold text-amber-600 hover:underline flex items-center space-x-1">
                      <span>Restock</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="space-y-2.5">
                    {(() => {
                      const lowStockList = (productsList?.data || []).filter(p => (Number(p.stock) || 0) <= 25).slice(0, 3);
                      if (lowStockList.length === 0) {
                        return (
                          <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 text-center text-xs text-emerald-800 font-semibold">
                            ✅ All medicines in database have healthy stock levels.
                          </div>
                        );
                      }
                      return lowStockList.map((item, i) => (
                        <div key={item.id || i} className="p-3.5 bg-[#fefdfa] hover:bg-amber-50/40 rounded-2xl border border-amber-100 flex items-center justify-between transition-colors">
                          <div className="flex items-center space-x-3.5 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs flex-shrink-0 font-black">
                              <AlertCircle className="w-5 h-5" />
                            </div>
                            <div className="truncate">
                              <h4 className="font-bold text-xs text-slate-900 truncate">{item.name}</h4>
                              <span className="text-[11px] text-slate-400 font-medium">{item.category?.name || item.dosage_form || 'Medicine'}</span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 pl-3">
                            <div className="text-xs font-black text-rose-600">{item.stock || 0} units left</div>
                            <div className="text-[10px] text-slate-400 font-medium">Batch: {item.batch_no || 'Standard'}</div>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>

              {/* Quick Actions (4 Large Colorful Rectangles Matching Screenshot) */}
              <div className="space-y-3">
                <h3 className="font-black text-slate-900 text-sm">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Action 1: Add Product (Orange) */}
                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setProductForm({
                        name: '',
                        subtitle: '',
                        category_id: categoriesList[0]?.id || 1,
                        sub_category_id: '',
                        batch_no: 'BT' + Date.now().toString().slice(-6),
                        manufacturer: 'MEDIGLAXO PHARMA',
                        description: '',
                        mrp: '',
                        base_price: '',
                        stock_quantity: 100,
                        box_packing: '1 Box (10 Strips)',
                        box_unit: 'Box',
                        strip_packing: '1 Strip (10 Tablets)',
                        strip_unit: 'Strip',
                        expiry_date: '',
                        status: 'Active',
                        image: '',
                      });
                      setShowProductModal(true);
                    }}
                    className="bg-[#ff5722] hover:bg-[#f4511e] text-white p-5 rounded-2xl flex items-center space-x-3.5 shadow-md shadow-[#ff5722]/20 text-left transition-all group"
                  >
                    <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <Plus className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-white">Add Product</h4>
                      <p className="text-[11px] text-white/80">Create new product</p>
                    </div>
                  </button>

                  {/* Action 2: Manage Categories (Blue) */}
                  <button
                    onClick={() => navigate('/admin/categories')}
                    className="bg-[#0288d1] hover:bg-[#0277bd] text-white p-5 rounded-2xl flex items-center space-x-3.5 shadow-md shadow-blue-500/20 text-left transition-all group"
                  >
                    <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <Tag className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-white">Manage Categories</h4>
                      <p className="text-[11px] text-white/80">View all categories</p>
                    </div>
                  </button>

                  {/* Action 3: View Products (Purple) */}
                  <button
                    onClick={() => navigate('/admin/products')}
                    className="bg-[#7c4dff] hover:bg-[#651fff] text-white p-5 rounded-2xl flex items-center space-x-3.5 shadow-md shadow-purple-500/20 text-left transition-all group"
                  >
                    <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-white">View Products</h4>
                      <p className="text-[11px] text-white/80">Browse inventory</p>
                    </div>
                  </button>

                  {/* Action 4: Manage Users (Green) */}
                  <button
                    onClick={() => navigate('/admin/super-distributors')}
                    className="bg-[#00c853] hover:bg-[#00b248] text-white p-5 rounded-2xl flex items-center space-x-3.5 shadow-md shadow-emerald-500/20 text-left transition-all group"
                  >
                    <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-white">Manage Users</h4>
                      <p className="text-[11px] text-white/80">View network</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* System Overview (3 Cards Matching Screenshot) */}
              <div className="space-y-3">
                <h3 className="font-black text-slate-900 text-sm">System Overview</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Card 1: Database Status */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center space-y-1">
                    <span className="text-xs font-bold text-slate-400 block">Database Status</span>
                    <div className="text-2xl font-black text-[#00c853]">Active</div>
                  </div>

                  {/* Card 2: Total Records */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center space-y-1">
                    <span className="text-xs font-bold text-slate-400 block">Total Records</span>
                    <div className="text-2xl font-black text-slate-900">
                      {((productsList?.data?.length || 59) + (categoriesList?.length || 66) + 2)}
                    </div>
                  </div>

                  {/* Card 3: System Version */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center space-y-1">
                    <span className="text-xs font-bold text-slate-400 block">System Version</span>
                    <div className="text-2xl font-black text-slate-900">v1.0.0</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 2. DOWNLINE NETWORK ROLES (MATCHING LIVE mgpjn.com)       */}
          {/* (Super Distributors, Distributors, Sub-Distributors,      */}
          {/*  Retailers, User Customer)                                */}
          {/* ======================================================== */}
          {NETWORK_ROLE_SECTIONS.includes(currentSection) && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">{sectionTitle}</h2>
                  <p className="text-xs text-slate-500">
                    {currentSection === 'customer-layer-1'
                      ? 'Direct Customers referred by Sub-Retailers (Local Delivery Hubs). Generates 15% instant commission.'
                      : currentSection === 'customer-layer-2'
                      ? 'Tier 2 Customers referred by Customer 1. Generates 15% for Customer 1 & 3% for Sub-Retailer.'
                      : currentSection === 'customer-layer-3'
                      ? 'Tier 3 Customers referred by Customer 2. Generates 15% for Customer 2, 3% for C1 & 2% for Sub-Retailer.'
                      : currentSection === 'sub-retailers'
                      ? 'Pincode & Local Executive Hubs responsible for doorstep pharma delivery.'
                      : `Manage all ${sectionTitle.toLowerCase()} in the network.`}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingUser(null);
                    setUserForm({
                      name: '',
                      business_name: '',
                      email: '',
                      mobile: '',
                      phone: '',
                      password: '',
                      role: currentMenuItem.roleType?.startsWith('customer') ? 'customer' : (currentMenuItem.roleType || 'super_distributor'),
                      sponsor_code: '',
                      address: '',
                      state: 'GUJRAT',
                      city: 'Surat',
                      pincode: '394230',
                      pan_number: '',
                      gst_number: '',
                      bank_name: '',
                      account_number: '',
                      ifsc_code: '',
                      upi_id: '',
                      status: 'active',
                    });
                    setShowAddUserModal(true);
                  }}
                  className="bg-[#ff5722] hover:bg-[#f4511e] text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md shadow-[#ff5722]/25 transition-all w-fit"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add {sectionTitle.replace(/\(.*?\)/g, '').trim()}</span>
                </button>
              </div>

              {/* 4 Colored Left-Border Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm border-l-4 border-l-[#ff5722]">
                  <span className="text-xs font-bold text-slate-500 block mb-1">Total {sectionTitle.replace(/\(.*?\)/g, '').trim()}</span>
                  <div className="text-2xl font-black text-slate-900">{roleStats.total}</div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm border-l-4 border-l-emerald-500">
                  <span className="text-xs font-bold text-slate-500 block mb-1">Active Accounts</span>
                  <div className="text-2xl font-black text-emerald-600">{roleStats.active}</div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm border-l-4 border-l-amber-500">
                  <span className="text-xs font-bold text-slate-500 block mb-1">
                    {currentSection.includes('customer') ? 'Commission Stage' : currentSection === 'sub-retailers' ? 'Pincode Auto-Routing' : 'Pending Approval'}
                  </span>
                  <div className="text-xl font-black text-amber-600 truncate">
                    {currentSection === 'customer-layer-1' ? 'Stage 1' :
                     currentSection === 'customer-layer-2' ? 'Stage 2' :
                     currentSection === 'customer-layer-3' ? 'Stage 3' :
                     currentSection === 'sub-retailers' ? 'Active & Live' :
                     roleStats.pending}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm border-l-4 border-l-rose-500">
                  <span className="text-xs font-bold text-slate-500 block mb-1">
                    {currentSection.includes('customer') ? 'Inactive / Pending' : 'Inactive'}
                  </span>
                  <div className="text-2xl font-black text-rose-500">
                    {currentSection.includes('customer') ? ((roleStats.pending || 0) + (roleStats.inactive || 0)) : roleStats.inactive}
                  </div>
                </div>
              </div>

              {/* Filter Bar */}
              <form onSubmit={handleSearchSubmit} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, email, member ID..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="w-36">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending Approval</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="w-48">
                  <select
                    value={stateFilter}
                    onChange={(e) => setStateFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                  >
                    <option value="all">🇮🇳 All States</option>
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st} {stateCounts[st] ? `(${stateCounts[st]})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-36">
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="name_asc">Name A-Z</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="bg-[#ff5722] hover:bg-[#f4511e] text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Search</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleResetSearch();
                    setStateFilter('all');
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                >
                  Reset
                </button>
              </form>

              {/* Data Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    {['customer-layer-1', 'customer-layer-2', 'customer-layer-3', 'all-customers', 'user_customer'].includes(currentSection) ? (
                      <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-100">
                        <tr>
                          <th className="p-3.5">CUSTOMER ID</th>
                          <th className="p-3.5">CUSTOMER NAME &amp; CONTACT</th>
                          <th className="p-3.5">LOCATION / PINCODE</th>
                          <th className="p-3.5">DIRECT SPONSOR / UPLINE HUB</th>
                          <th className="p-3.5">COMMISSION STAGE</th>
                          <th className="p-3.5">ORDERS &amp; SPENT</th>
                          <th className="p-3.5">STATUS</th>
                          <th className="p-3.5 text-right">ACTIONS</th>
                        </tr>
                      </thead>
                    ) : currentSection === 'sub-retailers' ? (
                      <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-100">
                        <tr>
                          <th className="p-3.5">HUB ID</th>
                          <th className="p-3.5">SUB-RETAILER / STORE</th>
                          <th className="p-3.5">ASSIGNED PINCODE / CITY</th>
                          <th className="p-3.5">DIRECT CUSTOMERS</th>
                          <th className="p-3.5">COMMISSION EARNED</th>
                          <th className="p-3.5">STATUS</th>
                          <th className="p-3.5 text-right">ACTIONS</th>
                        </tr>
                      </thead>
                    ) : (
                      <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-100">
                        <tr>
                          <th className="p-3.5">MEMBER ID</th>
                          <th className="p-3.5">NAME</th>
                          <th className="p-3.5">CONTACT</th>
                          <th className="p-3.5">NETWORK</th>
                          <th className="p-3.5">TOTAL SALES</th>
                          <th className="p-3.5">STATUS</th>
                          <th className="p-3.5 text-right">ACTIONS</th>
                        </tr>
                      </thead>
                    )}
                    <tbody className="divide-y divide-slate-100">
                      {roleUsers?.data?.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="p-8 text-center text-slate-400">
                            No {sectionTitle.toLowerCase()} found matching criteria.
                          </td>
                        </tr>
                      ) : (
                        roleUsers?.data?.map((u) => {
                          const isCust = ['customer-layer-1', 'customer-layer-2', 'customer-layer-3', 'all-customers', 'user_customer'].includes(currentSection);
                          const isSubRet = currentSection === 'sub-retailers';

                          if (isCust) {
                            return (
                              <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                                <td className="p-3.5 font-bold text-[#ff5722] font-mono">
                                  {u.referral_code || `CUST${u.id}`}
                                </td>
                                <td className="p-3.5">
                                  <div className="flex items-center space-x-2.5">
                                    <div className="w-7 h-7 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                                      {u.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <span className="font-bold text-slate-900 block">{u.name}</span>
                                      <span className="text-[11px] text-slate-400 font-mono block">{u.email}</span>
                                      <span className="text-[11px] text-slate-500 font-medium">{u.phone}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3.5 font-medium text-slate-700">
                                  <span className="block font-bold">{u.city || 'Surat'}</span>
                                  <span className="text-[11px] text-slate-400 font-mono">📍 {u.pincode || '394230'}</span>
                                </td>
                                <td className="p-3.5">
                                  {u.sponsor ? (
                                    <div>
                                      <span className="font-bold text-slate-800 block text-xs">{u.sponsor.name}</span>
                                      <span className="inline-block bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase mt-0.5">
                                        {u.sponsor.role === 'sub_retailer' ? '📍 Sub-Retailer Hub' : u.sponsor.role === 'customer' ? '👤 Customer Upline' : u.sponsor.role}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-mono block">Code: {u.sponsor.referral_code}</span>
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 italic text-[11px]">Direct / Head Office</span>
                                  )}
                                </td>
                                <td className="p-3.5">
                                  {currentSection === 'customer-layer-1' ? (
                                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-1 rounded-lg text-[10px] font-black inline-block">
                                      Stage 1: 15% Sponsor Commission
                                    </span>
                                  ) : currentSection === 'customer-layer-2' ? (
                                    <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-1 rounded-lg text-[10px] font-black inline-block">
                                      Stage 2: 15% (C1) + 3% (Sub-Retailer)
                                    </span>
                                  ) : currentSection === 'customer-layer-3' ? (
                                    <span className="bg-purple-50 text-purple-800 border border-purple-200 px-2 py-1 rounded-lg text-[10px] font-black inline-block">
                                      Stage 3: 15% (C2) + 3% (C1) + 2% (SR)
                                    </span>
                                  ) : (
                                    <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-lg text-[10px] font-bold inline-block">
                                      3-Stage Referral Downline
                                    </span>
                                  )}
                                </td>
                                <td className="p-3.5">
                                  <span className="font-black text-slate-900 block">₹{Number(u.total_spent || 0).toFixed(2)}</span>
                                  <span className="text-[10px] text-slate-500 font-semibold">{u.orders_count || 0} Orders placed</span>
                                </td>
                                <td className="p-3.5">
                                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                                    u.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                  }`}>
                                    {u.status || 'Active'}
                                  </span>
                                </td>
                                <td className="p-3.5 text-right space-x-1.5">
                                  {u.status === 'pending' && (
                                    <>
                                      <button
                                        onClick={() => handleApproveUser(u.id, u.name)}
                                        title="Approve Customer ID"
                                        className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200"
                                      >
                                        <CheckCheck className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleRejectUser(u.id, u.name)}
                                        title="Reject Customer ID"
                                        className="p-1.5 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}
                                  <button
                                    onClick={() => handleOpenPasswordModal(u)}
                                    title="Reset Password"
                                    className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"
                                  >
                                    <KeyRound className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleOpenTransferModal(u)}
                                    title="Move / Transfer Downline"
                                    className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg"
                                  >
                                    <ArrowLeftRight className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleToggleUserStatus(u.id, u.status === 'active' ? 'inactive' : 'active')}
                                    title={u.status === 'active' ? 'Deactivate ID' : 'Activate ID'}
                                    className={`p-1.5 rounded-lg ${u.status === 'active' ? 'text-rose-500 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                                  >
                                    {u.status === 'active' ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                  </button>
                                  <button
                                    onClick={() => handleImpersonate(u.id)}
                                    title="Login as user"
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                                  >
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => alert(`Customer Dossier:\nName: ${u.name}\nEmail: ${u.email}\nPhone: ${u.phone}\nPincode: ${u.pincode}\nSponsor: ${u.sponsor?.name || 'Direct'} (${u.sponsor?.role || 'None'})\nOrders: ${u.orders_count || 0}\nTotal Spent: ₹${(u.total_spent || 0).toFixed(2)}`)}
                                    title="View details"
                                    className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingUser(u);
                                      setUserForm({
                                        name: u.name,
                                        business_name: u.business_name || '',
                                        email: u.email,
                                        mobile: u.phone,
                                        phone: u.phone,
                                        password: '',
                                        role: u.role,
                                        sponsor_code: u.sponsor?.referral_code || '',
                                        address: u.address || '',
                                        state: u.state || 'GUJRAT',
                                        city: u.city || 'Surat',
                                        pincode: u.pincode || '394230',
                                        pan_number: u.pan_number || '',
                                        gst_number: u.gst_number || '',
                                        bank_name: u.bank_name || '',
                                        account_number: u.account_number || '',
                                        ifsc_code: u.ifsc_code || '',
                                        upi_id: u.upi_id || '',
                                        status: u.status || 'active',
                                      });
                                      setShowAddUserModal(true);
                                    }}
                                    title="Edit"
                                    className="p-1.5 text-brand-orange-500 hover:bg-orange-50 rounded-lg"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          }

                          if (isSubRet) {
                            return (
                              <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                                <td className="p-3.5 font-bold text-[#ff5722] font-mono">
                                  {u.referral_code || `SRT${u.id}`}
                                </td>
                                <td className="p-3.5">
                                  <div className="flex items-center space-x-2.5">
                                    <div className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                                      {u.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <span className="font-bold text-slate-900 block">{u.name}</span>
                                      {u.business_name && <span className="text-[10px] text-slate-500 block font-semibold">{u.business_name}</span>}
                                      <span className="text-[11px] text-slate-400 font-mono">{u.phone}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3.5">
                                  <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-bold text-[11px] inline-flex items-center space-x-1">
                                    <MapPin className="w-3 h-3 text-emerald-600" />
                                    <span>{u.pincode || '394230'} ({u.city || 'Surat'})</span>
                                  </span>
                                  <span className="text-[10px] text-slate-400 block mt-0.5">{u.state || 'GUJRAT'}</span>
                                </td>
                                <td className="p-3.5">
                                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[11px] font-bold">
                                    {u.referrals_count || 0} Direct Customers
                                  </span>
                                </td>
                                <td className="p-3.5 font-black text-slate-900">
                                  ₹{(u.total_earned || u.wallet_balance || 0).toFixed(2)}
                                </td>
                                <td className="p-3.5">
                                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                                    u.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                  }`}>
                                    {u.status || 'Active'}
                                  </span>
                                </td>
                                <td className="p-3.5 text-right space-x-1.5">
                                  {u.status === 'pending' && (
                                    <>
                                      <button
                                        onClick={() => handleApproveUser(u.id, u.name)}
                                        title="Verify & Approve Sub-Retailer Hub"
                                        className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200"
                                      >
                                        <CheckCheck className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleRejectUser(u.id, u.name)}
                                        title="Reject Sub-Retailer Application"
                                        className="p-1.5 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}
                                  <button
                                    onClick={() => handleOpenPasswordModal(u)}
                                    title="Reset Password"
                                    className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"
                                  >
                                    <KeyRound className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleOpenTransferModal(u)}
                                    title="Move / Transfer ID"
                                    className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg"
                                  >
                                    <ArrowLeftRight className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleToggleUserStatus(u.id, u.status === 'active' ? 'inactive' : 'active')}
                                    title={u.status === 'active' ? 'Deactivate ID' : 'Activate ID'}
                                    className={`p-1.5 rounded-lg ${u.status === 'active' ? 'text-rose-500 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                                  >
                                    {u.status === 'active' ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                  </button>
                                  <button
                                    onClick={() => handleImpersonate(u.id)}
                                    title="Login as user"
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                                  >
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => alert(`Sub-Retailer Hub Dossier:\nName: ${u.name}\nStore: ${u.business_name || 'N/A'}\nAssigned Pincode: ${u.pincode}\nCity: ${u.city}\nPhone: ${u.phone}\nWallet: ₹${u.wallet_balance || 0}\nCustomers: ${u.referrals_count || 0}`)}
                                    title="View details"
                                    className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingUser(u);
                                      setUserForm({
                                        name: u.name,
                                        business_name: u.business_name || '',
                                        email: u.email,
                                        mobile: u.phone,
                                        phone: u.phone,
                                        password: '',
                                        role: u.role,
                                        sponsor_code: '',
                                        address: u.address || '',
                                        state: u.state || 'GUJRAT',
                                        city: u.city || 'Surat',
                                        pincode: u.pincode || '394230',
                                        pan_number: u.pan_number || '',
                                        gst_number: u.gst_number || '',
                                        bank_name: u.bank_name || '',
                                        account_number: u.account_number || '',
                                        ifsc_code: u.ifsc_code || '',
                                        upi_id: u.upi_id || '',
                                        status: u.status || 'active',
                                      });
                                      setShowAddUserModal(true);
                                    }}
                                    title="Edit"
                                    className="p-1.5 text-brand-orange-500 hover:bg-orange-50 rounded-lg"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          }

                          // Standard Partner Row
                          return (
                            <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="p-3.5 font-bold text-[#ff5722]">
                                {u.referral_code || `MG${u.id}`}
                              </td>
                              <td className="p-3.5">
                                <div className="flex items-center space-x-2.5">
                                  <div className="w-7 h-7 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                                    {u.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <span className="font-bold text-slate-800 block">{u.name}</span>
                                    {u.business_name && <span className="text-[10px] text-slate-500 block font-semibold">{u.business_name}</span>}
                                    <span className="text-[11px] text-slate-400">{u.email}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3.5 font-medium text-slate-600">
                                {u.phone}
                              </td>
                              <td className="p-3.5 space-x-1">
                                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">
                                  {u.referrals_count || 0} DI
                                </span>
                                <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold">
                                  {u.referrals_count || 0} Total
                                </span>
                              </td>
                              <td className="p-3.5 font-bold text-slate-900">
                                ₹{(u.total_earned || 0).toFixed(0)}
                              </td>
                              <td className="p-3.5">
                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                                  u.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                                  u.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                                }`}>
                                  {u.status || 'Active'}
                                </span>
                              </td>
                              <td className="p-3.5 text-right space-x-1.5">
                                {u.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => handleApproveUser(u.id, u.name)}
                                      title="Verify & Approve Partner ID"
                                      className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200"
                                    >
                                      <CheckCheck className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleRejectUser(u.id, u.name)}
                                      title="Reject Partner Registration"
                                      className="p-1.5 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => handleOpenPasswordModal(u)}
                                  title="Reset Password"
                                  className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"
                                >
                                  <KeyRound className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleOpenTransferModal(u)}
                                  title="Move / Transfer ID"
                                  className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg"
                                >
                                  <ArrowLeftRight className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleToggleUserStatus(u.id, u.status === 'active' ? 'inactive' : 'active')}
                                  title={u.status === 'active' ? 'Deactivate ID' : 'Activate ID'}
                                  className={`p-1.5 rounded-lg ${u.status === 'active' ? 'text-rose-500 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                                >
                                  {u.status === 'active' ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  onClick={() => handleImpersonate(u.id)}
                                  title="Login as user"
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                                >
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => alert(`Partner Dossier:\nName: ${u.name}\nBusiness: ${u.business_name || 'N/A'}\nEmail: ${u.email}\nPhone: ${u.phone}\nState: ${u.state || 'GUJRAT'}\nCity: ${u.city || 'Surat'}\nGSTIN: ${u.gst_number || 'N/A'}`)}
                                  title="View details"
                                  className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingUser(u);
                                    setUserForm({
                                      name: u.name,
                                      business_name: u.business_name || '',
                                      email: u.email,
                                      mobile: u.phone,
                                      phone: u.phone,
                                      password: '',
                                      role: u.role,
                                      sponsor_code: '',
                                      address: u.address || '',
                                      state: u.state || 'GUJRAT',
                                      city: u.city || 'Surat',
                                      pincode: u.pincode || '394230',
                                      pan_number: u.pan_number || '',
                                      gst_number: u.gst_number || '',
                                      bank_name: u.bank_name || '',
                                      account_number: u.account_number || '',
                                      ifsc_code: u.ifsc_code || '',
                                      upi_id: u.upi_id || '',
                                      status: u.status || 'active',
                                    });
                                    setShowAddUserModal(true);
                                  }}
                                  title="Edit"
                                  className="p-1.5 text-brand-orange-500 hover:bg-orange-50 rounded-lg"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 3. PRODUCTS MANAGEMENT (WITH DITTO CREATE/EDIT FORM)     */}
          {/* ======================================================== */}
          {currentSection === 'products' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
                <div>
                  <h3 className="font-black text-slate-900 text-lg">Product Inventory</h3>
                  <p className="text-xs text-slate-500">Manage pharmaceutical inventory, wholesale/retail pricing, batch codes, and packaging units.</p>
                </div>

                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setProductForm({
                      name: '',
                      subtitle: '',
                      category_id: categoriesList[0]?.id || 1,
                      sub_category_id: '',
                      batch_no: 'BT' + Date.now().toString().slice(-6),
                      manufacturer: 'MEDIGLAXO PHARMA',
                      description: '',
                      mrp: '',
                      base_price: '',
                      stock_quantity: 100,
                      box_packing: '1 Box (10 Strips)',
                      box_unit: 'Box',
                      strip_packing: '1 Strip (10 Tablets)',
                      strip_unit: 'Strip',
                      expiry_date: '',
                      status: 'Active',
                      image: '',
                    });
                    setShowProductModal(true);
                  }}
                  className="bg-[#ff5722] hover:bg-[#f4511e] text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md shadow-[#ff5722]/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 uppercase text-[10px] font-bold text-slate-500">
                    <tr>
                      <th className="p-3.5">Medicine</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Batch / SHN</th>
                      <th className="p-3.5">MRP</th>
                      <th className="p-3.5">Base Price</th>
                      <th className="p-3.5">Stock</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {productsList?.data?.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60">
                        <td className="p-3.5 flex items-center space-x-3">
                          <img src={p.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=80'} alt={p.name} className="w-9 h-9 object-contain bg-white rounded-lg border p-1" />
                          <div>
                            <span className="font-bold text-slate-900 block">{p.name}</span>
                            <span className="text-[10px] text-slate-400 truncate max-w-xs block">{p.subtitle || p.composition}</span>
                          </div>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-700">
                          {p.category?.name || 'Tablets'}
                        </td>
                        <td className="p-3.5 font-mono text-slate-600 font-bold">
                          {p.batch_no || 'BT2026001'}
                        </td>
                        <td className="p-3.5 font-bold text-slate-900">
                          ₹{p.mrp || (p.price * 1.25).toFixed(2)}
                        </td>
                        <td className="p-3.5 font-bold text-emerald-600">
                          ₹{p.base_price || (p.price * 0.45).toFixed(2)}
                        </td>
                        <td className="p-3.5 font-bold text-slate-800">
                          {p.stock}
                        </td>
                        <td className="p-3.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.status === 'Inactive' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                            {p.status || 'Active'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setProductForm({
                                name: p.name,
                                subtitle: p.subtitle || p.composition || '',
                                category_id: p.category_id,
                                sub_category_id: p.sub_category_id || '',
                                batch_no: p.batch_no || '',
                                manufacturer: p.manufacturer || 'MEDIGLAXO PHARMA',
                                description: p.description || '',
                                mrp: p.mrp || p.price,
                                base_price: p.base_price || (p.price * 0.45),
                                stock_quantity: p.stock,
                                box_packing: p.box_packing || '1 Box (10 Strips)',
                                box_unit: p.box_unit || 'Box',
                                strip_packing: p.strip_packing || '1 Strip (10 Tablets)',
                                strip_unit: p.strip_unit || 'Strip',
                                expiry_date: p.expiry_date || '',
                                status: p.status || 'Active',
                                image: p.image || '',
                              });
                              setShowProductModal(true);
                            }}
                            className="text-brand-blue-700 hover:text-brand-blue-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenStatePriceModal(p)}
                            title="State-Wise Wholesale Pricing"
                            className="text-emerald-600 hover:text-emerald-800 p-1 hover:bg-emerald-50 rounded"
                          >
                            <SlidersHorizontal className="w-4 h-4" />
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm('Delete this product?')) {
                                await deleteAdminProduct(p.id);
                                fetchData();
                              }
                            }}
                            className="text-rose-500 hover:text-rose-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 4. MARGIN MANAGEMENT                                     */}
          {/* ======================================================== */}
          {currentSection === 'margins' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b">
                <div>
                  <h3 className="font-black text-slate-900 text-lg">Tier Margin Management</h3>
                  <p className="text-xs text-slate-500">Configure global margin percentage rules and minimum purchase volumes for every hierarchy level.</p>
                </div>
                <button
                  onClick={async () => {
                    setSavingMargins(true);
                    await updateAdminMargins({ margins });
                    setSavingMargins(false);
                    alert('Margins updated successfully.');
                  }}
                  disabled={savingMargins}
                  className="bg-[#ff5722] hover:bg-[#f4511e] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{savingMargins ? 'Saving...' : 'Save Global Margins'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(margins).map(([tierKey, tierData]) => (
                  <div key={tierKey} className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3">
                    <span className="text-xs font-black text-brand-blue-900 uppercase tracking-wider block">
                      {tierKey.replace('_', ' ')}
                    </span>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Wholesale Margin (%)</label>
                      <input
                        type="number"
                        value={tierData.margin_percentage || 0}
                        onChange={(e) => setMargins({
                          ...margins,
                          [tierKey]: { ...tierData, margin_percentage: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-full px-3 py-2 bg-white border rounded-xl text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Min Order Quantity (Units)</label>
                      <input
                        type="number"
                        value={tierData.min_order_qty || 1}
                        onChange={(e) => setMargins({
                          ...margins,
                          [tierKey]: { ...tierData, min_order_qty: parseInt(e.target.value) || 1 }
                        })}
                        className="w-full px-3 py-2 bg-white border rounded-xl text-xs font-bold"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 5. TRANSFER MANAGEMENT (HIERARCHY & WALLET)              */}
          {/* ======================================================== */}
          {currentSection === 'transfers' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b">
                <div>
                  <h3 className="font-black text-slate-900 text-lg">Transfer Management</h3>
                  <p className="text-xs text-slate-500">Migrate downline members under new parent sponsors or execute wallet credit/debit adjustments.</p>
                </div>
                <button
                  onClick={() => setShowTransferModal(true)}
                  className="bg-[#ff5722] hover:bg-[#f4511e] text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Transfer</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 uppercase text-[10px] font-bold text-slate-500">
                    <tr>
                      <th className="p-3.5">TRANSFER ID</th>
                      <th className="p-3.5">SENDER / ADMIN</th>
                      <th className="p-3.5">RECEIVER / TARGET</th>
                      <th className="p-3.5">AMOUNT / MIGRATION</th>
                      <th className="p-3.5">TYPE</th>
                      <th className="p-3.5">STATUS</th>
                      <th className="p-3.5">DATE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transfersList?.data?.length === 0 ? (
                      <tr><td colSpan="7" className="p-8 text-center text-slate-400">No transfer records found.</td></tr>
                    ) : (
                      transfersList?.data?.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/60">
                          <td className="p-3.5 font-bold text-brand-blue-800">{t.transfer_number}</td>
                          <td className="p-3.5 font-medium">{t.sender_name || 'Super Admin'}</td>
                          <td className="p-3.5 font-bold text-slate-900">{t.receiver_name} ({t.receiver_code})</td>
                          <td className="p-3.5 font-black text-emerald-600">₹{t.amount}</td>
                          <td className="p-3.5 uppercase text-[10px] font-bold text-slate-600">{t.transfer_type}</td>
                          <td className="p-3.5"><span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{t.status}</span></td>
                          <td className="p-3.5 text-slate-400">{new Date(t.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 6. PRODUCT MARGIN LIST                                   */}
          {/* ======================================================== */}
          {currentSection === 'product-margins' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-black text-slate-900 text-lg">Product Margin &amp; Price List</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 uppercase text-[10px] font-bold text-slate-500">
                    <tr>
                      <th className="p-3">Medicine</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Retail Price</th>
                      <th className="p-3">Base Price</th>
                      <th className="p-3">Wholesale Price</th>
                      <th className="p-3">MRP</th>
                      <th className="p-3 font-bold text-purple-700">Margin Spread</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {productMarginsList?.data?.map((p) => {
                      const retail = Number(p.retail_price || p.price || 0);
                      const base = Number(p.base_price || retail * 0.45);
                      const wholesale = Number(p.wholesale_price || retail * 0.60);
                      const mrp = Number(p.mrp || retail * 1.25);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/60">
                          <td className="p-3 font-bold text-slate-900">{p.name}</td>
                          <td className="p-3">{p.category?.name || 'Tablets'}</td>
                          <td className="p-3 font-bold text-slate-800">₹{retail.toFixed(0)}</td>
                          <td className="p-3 font-bold text-blue-600">₹{base.toFixed(0)}</td>
                          <td className="p-3 font-bold text-emerald-600">₹{wholesale.toFixed(0)}</td>
                          <td className="p-3 text-slate-400">₹{mrp.toFixed(0)}</td>
                          <td className="p-3 font-black text-purple-700">₹{(retail - base).toFixed(0)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 7. OTHER MODULES (CATEGORIES, ORDERS, WALLET, BANNERS)   */}
          {/* ======================================================== */}
          {currentSection === 'categories' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-4 border-b">
                <h3 className="font-black text-slate-900 text-lg">Category Hierarchy ({categoriesList.length})</h3>
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setCategoryForm({ name: '', parent_id: '', icon: '', image: '', description: '', sort_order: 0, is_active: true });
                    setShowCategoryModal(true);
                  }}
                  className="bg-[#ff5722] hover:bg-[#f4511e] text-white px-4 py-2 rounded-xl text-xs font-bold"
                >
                  + Add Category
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {categoriesList.map((c) => (
                  <div key={c.id} className="bg-slate-50 p-4 rounded-2xl border space-y-2">
                    <h4 className="font-bold text-xs text-slate-900">{c.name}</h4>
                    <p className="text-[11px] text-slate-500">{c.children?.length || 0} subcategories</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentSection === 'orders' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b">
                <div>
                  <h3 className="font-black text-slate-900 text-lg">Customer &amp; Wholesale Orders</h3>
                  <p className="text-xs text-slate-500">Live order fulfillment with Pincode Sub-Retailer Auto-Routing and GST Invoicing.</p>
                </div>
                <span className="text-xs font-bold text-slate-400">Total: {ordersList?.data?.length || 0} Orders</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 uppercase text-[10px] font-bold text-slate-500">
                    <tr>
                      <th className="p-3">Order / Invoice ID</th>
                      <th className="p-3">Customer &amp; Pincode</th>
                      <th className="p-3">Assigned Sub-Retailer Hub</th>
                      <th className="p-3">Total Amount</th>
                      <th className="p-3">Order Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ordersList?.data?.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-bold text-brand-blue-800">
                          {ord.order_number}
                          {ord.invoice_number && (
                            <span className="text-[10px] text-slate-400 font-mono block">{ord.invoice_number}</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-slate-900 block">{ord.customer_name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{ord.phone} • {ord.city} ({ord.pincode})</span>
                        </td>
                        <td className="p-3">
                          {ord.assigned_sub_retailer ? (
                            <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-bold text-[10px] inline-block">
                              📍 {ord.assigned_sub_retailer.name} ({ord.assigned_sub_retailer.pincode})
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px] italic">Central Warehouse</span>
                          )}
                        </td>
                        <td className="p-3 font-black text-slate-900">
                          ₹{Number(ord.total_amount).toFixed(2)}
                          <span className="text-[10px] text-slate-400 block uppercase font-normal">{ord.payment_method} ({ord.payment_status})</span>
                        </td>
                        <td className="p-3">
                          <select
                            value={ord.order_status}
                            onChange={async (e) => {
                              await updateAdminOrderStatus(ord.id, { order_status: e.target.value });
                              fetchData();
                            }}
                            className="bg-slate-50 border rounded-lg px-2 py-1 text-xs font-semibold"
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="dispatched">Dispatched</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => setSelectedInvoiceOrderId(ord.id)}
                            className="bg-brand-orange-50 hover:bg-brand-orange-100 text-brand-orange-600 px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center space-x-1 transition-colors cursor-pointer border border-brand-orange-200"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>GST Bill</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MEDICINE PURCHASE ORDER (PO) APPROVALS                   */}
          {/* ======================================================== */}
          {currentSection === 'purchase-orders' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Medicine Purchase Order (PO) Approvals</h2>
                  <p className="text-xs text-slate-500">
                    Review and verify wholesale medicine orders from State Distributors &amp; Retailers. Super Admin approves/adjusts requested batch quantities before issuing the official GST Tax Invoice.
                  </p>
                </div>
              </div>

              {/* Top 4 PO Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm border-l-4 border-l-[#ff5722]">
                  <span className="text-xs font-bold text-slate-500 block mb-1">Total POs Submitted</span>
                  <div className="text-2xl font-black text-slate-900">{purchaseOrdersList?.data?.length || 0}</div>
                  <span className="text-[11px] text-slate-400 font-semibold">Bulk medicine requests</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm border-l-4 border-l-amber-500">
                  <span className="text-xs font-bold text-slate-500 block mb-1">Pending Approval</span>
                  <div className="text-2xl font-black text-amber-500">
                    {purchaseOrdersList?.data?.filter(po => po.status === 'pending').length || 0}
                  </div>
                  <span className="text-[11px] text-amber-600 font-semibold">Requires Super Admin verification</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm border-l-4 border-l-emerald-500">
                  <span className="text-xs font-bold text-slate-500 block mb-1">Approved &amp; Invoiced</span>
                  <div className="text-2xl font-black text-emerald-600">
                    {purchaseOrdersList?.data?.filter(po => po.status === 'approved').length || 0}
                  </div>
                  <span className="text-[11px] text-emerald-700 font-semibold">GST Invoices generated</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm border-l-4 border-l-blue-500">
                  <span className="text-xs font-bold text-slate-500 block mb-1">Total Order Value</span>
                  <div className="text-2xl font-black text-slate-900">
                    ₹{purchaseOrdersList?.data?.reduce((acc, po) => acc + (parseFloat(po.total_amount) || 0), 0).toFixed(2) || '0.00'}
                  </div>
                  <span className="text-[11px] text-blue-600 font-semibold">Wholesale volume</span>
                </div>
              </div>

              {/* Filter Bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
                <div className="w-48">
                  <select
                    value={stateFilter}
                    onChange={(e) => setStateFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                  >
                    <option value="all">🇮🇳 All States</option>
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div className="w-36">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('all');
                    setStateFilter('all');
                    fetchData();
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold transition-all ml-auto"
                >
                  Reset Filters
                </button>
              </div>

              {/* POs Data Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 uppercase text-[10px] font-bold text-slate-500 border-b border-slate-100">
                      <tr>
                        <th className="p-3.5">PO NUMBER</th>
                        <th className="p-3.5">REQUESTER &amp; STORE</th>
                        <th className="p-3.5">STATE HUB</th>
                        <th className="p-3.5">MEDICINES REQUESTED</th>
                        <th className="p-3.5">ESTIMATED AMOUNT</th>
                        <th className="p-3.5">STATUS</th>
                        <th className="p-3.5 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {purchaseOrdersList?.data?.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="p-8 text-center text-slate-400">
                            No Purchase Orders submitted yet.
                          </td>
                        </tr>
                      ) : (
                        purchaseOrdersList?.data?.map((po) => (
                          <tr key={po.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="p-3.5 font-bold font-mono text-[#ff5722]">
                              {po.po_number}
                              <span className="text-[10px] text-slate-400 block font-sans font-normal">
                                {new Date(po.created_at).toLocaleDateString('en-GB')}
                              </span>
                            </td>
                            <td className="p-3.5">
                              <span className="font-bold text-slate-900 block">{po.user?.name}</span>
                              {po.user?.business_name && (
                                <span className="text-[10px] text-slate-500 block font-semibold">{po.user.business_name}</span>
                              )}
                              <span className="inline-block bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase mt-0.5">
                                {po.user?.role}
                              </span>
                            </td>
                            <td className="p-3.5 font-bold text-emerald-800">
                              📍 {po.state || 'GUJRAT'}
                            </td>
                            <td className="p-3.5">
                              <span className="font-bold text-slate-800 block">
                                {po.items?.length || 0} Medicine Items
                              </span>
                              <span className="text-[10px] text-slate-400 block">
                                Total {po.items?.reduce((acc, it) => acc + (it.requested_quantity || 0), 0)} Units requested
                              </span>
                            </td>
                            <td className="p-3.5 font-black text-slate-900">
                              ₹{Number(po.total_amount || 0).toFixed(2)}
                            </td>
                            <td className="p-3.5">
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                                po.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                                po.status === 'rejected' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                              }`}>
                                {po.status}
                              </span>
                            </td>
                            <td className="p-3.5 text-right space-x-2">
                              {po.status === 'pending' ? (
                                <button
                                  onClick={() => handleOpenPOModal(po)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-bold text-xs inline-flex items-center space-x-1 shadow-sm"
                                >
                                  <CheckCheck className="w-3.5 h-3.5" />
                                  <span>Review &amp; Approve</span>
                                </button>
                              ) : (
                                <div className="inline-flex items-center space-x-1.5">
                                  <button
                                    onClick={() => handleOpenPOModal(po)}
                                    className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                                    title="View PO breakdown"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  {po.order_id && (
                                    <button
                                      onClick={() => setSelectedInvoiceOrderId(po.order_id)}
                                      className="bg-brand-orange-50 hover:bg-brand-orange-100 text-brand-orange-600 border border-brand-orange-200 px-2.5 py-1 rounded-lg font-bold text-xs inline-flex items-center space-x-1"
                                    >
                                      <Printer className="w-3 h-3" />
                                      <span>GST Invoice</span>
                                    </button>
                                  )}
                                </div>
                              )}
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

          {currentSection === 'wallet' && (
            <div className="space-y-6">
              {/* Top 4 Wallet Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm border-l-4 border-l-[#ff5722]">
                  <span className="text-xs font-bold text-slate-500 block mb-1">Total Payouts Requested</span>
                  <div className="text-2xl font-black text-slate-900">
                    ₹{payoutsList?.data?.reduce((acc, p) => acc + parseFloat(p.amount || 0), 0).toFixed(2) || '0.00'}
                  </div>
                  <span className="text-[11px] text-slate-400 font-semibold">{payoutsList?.data?.length || 0} total requests</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm border-l-4 border-l-amber-500">
                  <span className="text-xs font-bold text-slate-500 block mb-1">Pending Clearance</span>
                  <div className="text-2xl font-black text-amber-500">
                    ₹{payoutsList?.data?.filter(p => p.status === 'pending').reduce((acc, p) => acc + parseFloat(p.amount || 0), 0).toFixed(2) || '0.00'}
                  </div>
                  <span className="text-[11px] text-amber-600 font-semibold">
                    {payoutsList?.data?.filter(p => p.status === 'pending').length || 0} pending review
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm border-l-4 border-l-emerald-500">
                  <span className="text-xs font-bold text-slate-500 block mb-1">Settled &amp; Paid (Bank)</span>
                  <div className="text-2xl font-black text-emerald-600">
                    ₹{payoutsList?.data?.filter(p => p.status === 'approved').reduce((acc, p) => acc + parseFloat(p.amount || 0), 0).toFixed(2) || '0.00'}
                  </div>
                  <span className="text-[11px] text-emerald-700 font-semibold">
                    {payoutsList?.data?.filter(p => p.status === 'approved').length || 0} completed
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm border-l-4 border-l-purple-600">
                  <span className="text-xs font-bold text-slate-500 block mb-1">Quick Action</span>
                  <button
                    onClick={() => {
                      setTransferMode('wallet_transfer');
                      setShowTransferModal(true);
                    }}
                    className="mt-1 w-full bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold py-2 rounded-xl text-xs transition-colors flex items-center justify-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Direct Wallet Adjust</span>
                  </button>
                </div>
              </div>

              {/* Commission Wallet Table */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
                  <div>
                    <h3 className="font-black text-slate-900 text-base">Partner Commission Payouts &amp; Bank Transfers</h3>
                    <p className="text-xs text-slate-500">Review, verify and process downline distributor withdrawal requests.</p>
                  </div>
                  <button
                    onClick={() => {
                      setTransferMode('wallet_transfer');
                      setShowTransferModal(true);
                    }}
                    className="bg-[#ff5722] hover:bg-[#f4511e] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Credit / Debit Wallet</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 uppercase text-[10px] font-bold text-slate-500">
                      <tr>
                        <th className="p-3.5">REQUEST ID</th>
                        <th className="p-3.5">PARTNER</th>
                        <th className="p-3.5">GROSS WITHDRAWAL</th>
                        <th className="p-3.5">TDS / CHARGES (5%)</th>
                        <th className="p-3.5">NET PAYABLE</th>
                        <th className="p-3.5">BANK ACCOUNT / UPI</th>
                        <th className="p-3.5">STATUS</th>
                        <th className="p-3.5 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payoutsList?.data?.length === 0 ? (
                        <tr><td colSpan="8" className="p-8 text-center text-slate-400">No payout requests in the ledger.</td></tr>
                      ) : (
                        payoutsList?.data?.map((pay) => {
                          const gross = parseFloat(pay.amount || 0);
                          const fee = pay.admin_fee ? parseFloat(pay.admin_fee) : round(gross * 0.05, 2);
                          const net = pay.net_payable ? parseFloat(pay.net_payable) : (gross - fee);
                          return (
                            <tr key={pay.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="p-3.5 font-bold text-brand-blue-800">#PAY-{pay.id}</td>
                              <td className="p-3.5">
                                <span className="font-bold text-slate-900 block">{pay.user?.name || 'Partner'}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{pay.user?.referral_code} • {pay.user?.phone}</span>
                              </td>
                              <td className="p-3.5 font-black text-slate-900">₹{gross.toFixed(2)}</td>
                              <td className="p-3.5 text-rose-600 font-semibold">-₹{fee.toFixed(2)}</td>
                              <td className="p-3.5 font-black text-emerald-600">₹{net.toFixed(2)}</td>
                              <td className="p-3.5 font-mono text-[11px] max-w-[200px] truncate" title={pay.account_details}>
                                {pay.account_details}
                              </td>
                              <td className="p-3.5">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  pay.status === 'approved'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : pay.status === 'pending'
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'bg-rose-50 text-rose-700'
                                }`}>
                                  {pay.status}
                                </span>
                              </td>
                              <td className="p-3.5 text-right space-x-1.5">
                                {pay.status === 'pending' ? (
                                  <>
                                    <button
                                      onClick={async () => {
                                        const ref = prompt('Enter Bank UTR / Transaction Reference ID:', 'UTR' + Date.now().toString().slice(-8));
                                        if (ref !== null) {
                                          await processAdminPayout(pay.id, { action: 'approve', transaction_ref: ref });
                                          fetchData();
                                          alert('Payout marked as Approved & Settled.');
                                        }
                                      }}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg font-bold text-[11px] shadow-xs"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={async () => {
                                        const note = prompt('Reason for rejection (Funds will be refunded automatically to partner wallet):', 'Account details mismatched');
                                        if (note !== null) {
                                          await processAdminPayout(pay.id, { action: 'reject', admin_note: note });
                                          fetchData();
                                          alert('Payout rejected and ₹' + pay.amount + ' refunded to partner wallet.');
                                        }
                                      }}
                                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1 rounded-lg font-bold text-[11px]"
                                    >
                                      Reject &amp; Refund
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {pay.transaction_ref || pay.admin_note || 'Completed'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {currentSection === 'banners' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b">
                <h3 className="font-black text-slate-900 text-lg">Promotional Banners</h3>
                <button onClick={() => setShowBannerModal(true)} className="bg-[#ff5722] hover:bg-[#f4511e] text-white px-4 py-2 rounded-xl text-xs font-bold">
                  + Add Banner
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {bannersList.map((b) => (
                  <div key={b.id} className="bg-slate-50 rounded-2xl overflow-hidden border p-3 space-y-2">
                    <img src={b.image} alt={b.title} className="w-full h-32 object-cover rounded-xl" />
                    <h4 className="font-bold text-xs text-slate-800">{b.title}</h4>
                    <button onClick={async () => { await deleteAdminBanner(b.id); fetchData(); }} className="text-rose-600 text-[11px] font-bold">Delete</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentSection === 'reports' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
              <h3 className="font-black text-slate-900 text-lg">Business &amp; GST Reports</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 p-5 rounded-2xl border">
                  <h4 className="font-bold text-xs text-slate-800 uppercase mb-3">Daily Paid Sales</h4>
                  {reportsData?.daily_sales?.map((d, i) => (
                    <div key={i} className="flex justify-between text-xs py-1 border-b">
                      <span>{d.date}</span>
                      <strong>₹{parseFloat(d.total).toFixed(2)} ({d.order_count} orders)</strong>
                    </div>
                  ))}
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border">
                  <h4 className="font-bold text-xs text-slate-800 uppercase mb-3">Category Revenue</h4>
                  {reportsData?.category_sales?.map((c, i) => (
                    <div key={i} className="flex justify-between text-xs py-1 border-b">
                      <span>{c.category_name}</span>
                      <strong className="text-emerald-700">₹{parseFloat(c.total_revenue).toFixed(2)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentSection === 'employees' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b">
                <h3 className="font-black text-slate-900 text-lg">Employee Module &amp; Role Permissions</h3>
                <button onClick={() => { setEditingEmployee(null); setShowEmployeeModal(true); }} className="bg-[#ff5722] hover:bg-[#f4511e] text-white px-4 py-2 rounded-xl text-xs font-bold">
                  + Add Employee
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 uppercase text-[10px] font-bold text-slate-500">
                    <tr>
                      <th className="p-3">Staff Name</th>
                      <th className="p-3">Contact</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {employeesList.map((emp) => (
                      <tr key={emp.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{emp.name}</td>
                        <td className="p-3">{emp.email} • {emp.phone}</td>
                        <td className="p-3 font-semibold text-brand-blue-800">{emp.department || 'Operations'}</td>
                        <td className="p-3"><span className="bg-slate-100 px-2 py-0.5 rounded font-bold uppercase text-[10px]">{emp.role}</span></td>
                        <td className="p-3"><span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold text-[10px]">{emp.status || 'Active'}</span></td>
                        <td className="p-3 text-right">
                          <button onClick={() => { setEditingEmployee(emp); setEmployeeForm({ ...emp, permissions: emp.permissions || {} }); setShowEmployeeModal(true); }} className="text-[#ff5722] font-bold hover:underline">
                            Edit Permissions
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {currentSection === 'settings' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
              <h3 className="font-black text-slate-900 text-lg">System &amp; Platform Configuration</h3>
              <form onSubmit={async (e) => { e.preventDefault(); await updateAdminSettings({ settings: settingsData }); alert('Settings updated.'); }} className="space-y-4 max-w-2xl text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Company Legal Entity</label>
                  <input type="text" value={settingsData.company_name} onChange={(e) => setSettingsData({ ...settingsData, company_name: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl font-medium" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Official GSTIN</label>
                  <input type="text" value={settingsData.gstin} onChange={(e) => setSettingsData({ ...settingsData, gstin: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl font-mono font-bold" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Customer Helpline &amp; WhatsApp</label>
                  <input type="text" value={settingsData.helpline} onChange={(e) => setSettingsData({ ...settingsData, helpline: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl font-medium" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Min Free Delivery Amount (₹)</label>
                    <input type="number" value={settingsData.free_shipping_min} onChange={(e) => setSettingsData({ ...settingsData, free_shipping_min: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl font-bold" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Minimum Payout Threshold (₹)</label>
                    <input type="number" value={settingsData.min_payout} onChange={(e) => setSettingsData({ ...settingsData, min_payout: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl font-bold" />
                  </div>
                </div>
                <button type="submit" className="bg-[#ff5722] hover:bg-[#f4511e] text-white px-6 py-3 rounded-xl font-bold shadow-md">
                  Save Settings
                </button>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: ADD / EDIT PRODUCT (DITTO FROM mgpjn.com)       */}
      {/* ======================================================== */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {editingProduct ? 'Edit Medicine' : 'Add New Product'}
                </h3>
                <p className="text-[11px] text-slate-500">Add pharmaceutical product to inventory</p>
              </div>
              <button onClick={() => setShowProductModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              {/* Product Information */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">Product Information</h4>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Pantop-D SR Capsule"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Subtitle / Composition</label>
                  <input
                    type="text"
                    placeholder="e.g., Domperidone (30mg)+ Pantoprazole (40mg)"
                    value={productForm.subtitle}
                    onChange={(e) => setProductForm({ ...productForm, subtitle: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Category *</label>
                    <select
                      required
                      value={productForm.category_id}
                      onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value, sub_category_id: '' })}
                      className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-bold"
                    >
                      <option value="">Select Category</option>
                      {categoriesList.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Sub Category *</label>
                    <select
                      value={productForm.sub_category_id}
                      onChange={(e) => setProductForm({ ...productForm, sub_category_id: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-bold"
                    >
                      <option value="">{availableSubCats.length > 0 ? 'Select Sub Category' : 'First select a category'}</option>
                      {availableSubCats.map((sc) => (
                        <option key={sc.id} value={sc.id}>{sc.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">SHN / Batch No *</label>
                    <input
                      type="text"
                      required
                      placeholder="BT2026001"
                      value={productForm.batch_no}
                      onChange={(e) => setProductForm({ ...productForm, batch_no: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Brand / Manufacturer</label>
                    <input
                      type="text"
                      placeholder="Company name"
                      value={productForm.manufacturer}
                      onChange={(e) => setProductForm({ ...productForm, manufacturer: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Product Description</label>
                  <textarea
                    rows={2}
                    placeholder="Indications, usage and benefits"
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Product Image (Upload File or URL)</label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <label className="flex items-center space-x-1.5 px-3 py-2 bg-brand-blue-50 text-brand-blue-800 hover:bg-brand-blue-100 rounded-xl border border-brand-blue-200 cursor-pointer font-bold transition-all text-[11px]">
                        <Upload className="w-4 h-4" />
                        <span>{uploadingProductImage ? 'Uploading Image...' : 'Upload Image File'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProductImageUpload}
                          disabled={uploadingProductImage}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[10px] text-slate-400 font-medium">Auto-saves to database &amp; storage</span>
                    </div>

                    <input
                      type="url"
                      placeholder="Or paste direct image URL (https://...)"
                      value={productForm.image}
                      onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-mono text-[11px]"
                    />

                    {productForm.image && (
                      <div className="flex items-center space-x-3 p-2 bg-slate-50 rounded-xl border border-slate-200">
                        <img
                          src={productForm.image}
                          alt="Product Preview"
                          className="w-12 h-12 object-contain rounded-lg bg-white border border-slate-100 p-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-[11px] font-bold text-slate-800 block truncate">Image Ready</span>
                          <span className="text-[9px] font-mono text-slate-400 truncate block">{productForm.image}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setProductForm({ ...productForm, image: '' })}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="space-y-3 pt-3 border-t">
                <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">Pricing &amp; Stock</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">MRP (Maximum Retail Price) *</label>
                    <input
                      type="number"
                      required
                      placeholder="100.00"
                      value={productForm.mrp}
                      onChange={(e) => setProductForm({ ...productForm, mrp: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-black text-sm"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">Base MRP for calculations</span>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Base Price (₹) *</label>
                    <input
                      type="number"
                      required
                      placeholder="45.00"
                      value={productForm.base_price}
                      onChange={(e) => setProductForm({ ...productForm, base_price: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-black text-sm text-emerald-600"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">Admin purchase rate</span>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Stock Quantity *</label>
                    <input
                      type="number"
                      required
                      placeholder="100"
                      value={productForm.stock_quantity}
                      onChange={(e) => setProductForm({ ...productForm, stock_quantity: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-bold"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">Available units</span>
                  </div>
                </div>
              </div>

              {/* Packaging Specifications (Wholesaler & Retailer) */}
              <div className="space-y-3 pt-3 border-t">
                <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">Packaging Specifications</h4>
                <div className="grid grid-cols-2 gap-4">
                  {/* Box Packaging for Wholesaler */}
                  <div className="p-3 bg-slate-50 rounded-xl border space-y-2">
                    <span className="font-bold text-slate-700 block">Box Packaging for Wholesaler</span>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Packing *</label>
                      <input
                        type="text"
                        placeholder="e.g., 1 Box (10 Strips)"
                        value={productForm.box_packing}
                        onChange={(e) => setProductForm({ ...productForm, box_packing: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Unit</label>
                      <select
                        value={productForm.box_unit}
                        onChange={(e) => setProductForm({ ...productForm, box_unit: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border rounded-lg font-medium"
                      >
                        {PACKAGING_UNITS.map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Strip Packaging for Customer */}
                  <div className="p-3 bg-slate-50 rounded-xl border space-y-2">
                    <span className="font-bold text-slate-700 block">Strip Packaging for Customer</span>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Packing *</label>
                      <input
                        type="text"
                        placeholder="e.g., 1 Strip (10 Tablets)"
                        value={productForm.strip_packing}
                        onChange={(e) => setProductForm({ ...productForm, strip_packing: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Unit</label>
                      <select
                        value={productForm.strip_unit}
                        onChange={(e) => setProductForm({ ...productForm, strip_unit: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border rounded-lg font-medium"
                      >
                        {PACKAGING_UNITS.map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expiry & Status */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={productForm.expiry_date}
                    onChange={(e) => setProductForm({ ...productForm, expiry_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status *</label>
                  <select
                    value={productForm.status}
                    onChange={(e) => setProductForm({ ...productForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-bold"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button type="button" onClick={() => setShowProductModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-[#ff5722] hover:bg-[#f4511e] text-white rounded-xl font-bold shadow-md">
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: ADD / EDIT DOWNLINE PARTNER (DITTO mgpjn.com)   */}
      {/* ======================================================== */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="text-base font-black text-slate-900">
                {editingUser ? 'Edit Partner Details' : `Add New ${sectionTitle.slice(0, -1)}`}
              </h3>
              <button onClick={() => setShowAddUserModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter full name"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Business Name</label>
                  <input
                    type="text"
                    placeholder="Company / Agency name"
                    value={userForm.business_name}
                    onChange={(e) => setUserForm({ ...userForm, business_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    disabled={!!editingUser}
                    placeholder="email@example.com"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={userForm.mobile || userForm.phone}
                    onChange={(e) => setUserForm({ ...userForm, mobile: e.target.value, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium"
                  />
                </div>
              </div>

              {!editingUser && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Set login password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium"
                  />
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Complete Address</label>
                <textarea
                  rows={2}
                  placeholder="Address details"
                  value={userForm.address}
                  onChange={(e) => setUserForm({ ...userForm, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">State *</label>
                  <select
                    value={userForm.state}
                    onChange={(e) => setUserForm({ ...userForm, state: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-bold"
                  >
                    {INDIAN_STATES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="Surat"
                    value={userForm.city}
                    onChange={(e) => setUserForm({ ...userForm, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pincode</label>
                  <input
                    type="text"
                    placeholder="394230"
                    value={userForm.pincode}
                    onChange={(e) => setUserForm({ ...userForm, pincode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">PAN Number</label>
                  <input
                    type="text"
                    placeholder="ABCDE1234F"
                    value={userForm.pan_number}
                    onChange={(e) => setUserForm({ ...userForm, pan_number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    placeholder="24ABVFM0075D1ZA"
                    value={userForm.gst_number}
                    onChange={(e) => setUserForm({ ...userForm, gst_number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button type="button" onClick={() => setShowAddUserModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-[#ff5722] hover:bg-[#f4511e] text-white rounded-xl font-bold shadow-md">
                  Save Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: CREATE TRANSFER / DOWNLINE TREE MIGRATION       */}
      {/* ======================================================== */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="text-base font-black text-slate-900">Create Transfer / Migration</h3>
              <button onClick={() => setShowTransferModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setTransferMode('tree_migration')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${transferMode === 'tree_migration' ? 'bg-white text-[#ff5722] shadow-xs' : 'text-slate-600'}`}
              >
                Hierarchy Migration
              </button>
              <button
                type="button"
                onClick={() => setTransferMode('wallet_transfer')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${transferMode === 'wallet_transfer' ? 'bg-white text-[#ff5722] shadow-xs' : 'text-slate-600'}`}
              >
                Wallet Fund Transfer
              </button>
            </div>

            <form onSubmit={handleSaveTransfer} className="space-y-3.5 text-xs">
              {transferMode === 'tree_migration' ? (
                <>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Current Level *</label>
                    <select
                      value={transferForm.current_level}
                      onChange={(e) => setTransferForm({ ...transferForm, current_level: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-bold"
                    >
                      <option value="Super Distributor">Super Distributor</option>
                      <option value="Distributor">Distributor</option>
                      <option value="Retailer">Retailer</option>
                      <option value="Customer">Customer</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Select User To Migrate *</label>
                    <select
                      required
                      value={transferForm.user_id}
                      onChange={(e) => setTransferForm({ ...transferForm, user_id: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-bold"
                    >
                      <option value="">Select User</option>
                      {roleUsers?.data?.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.referral_code})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">New Parent Sponsor *</label>
                    <select
                      required
                      value={transferForm.new_parent_id}
                      onChange={(e) => setTransferForm({ ...transferForm, new_parent_id: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-bold"
                    >
                      <option value="">Select New Parent</option>
                      {roleUsers?.data?.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.referral_code})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Transfer Reason</label>
                    <input
                      type="text"
                      placeholder="Reason for downline migration"
                      value={transferForm.reason}
                      onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Receiver Referral Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SD87106694"
                      value={transferForm.receiver_code}
                      onChange={(e) => setTransferForm({ ...transferForm, receiver_code: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Amount (₹) *</label>
                    <input
                      type="number"
                      required
                      value={transferForm.amount}
                      onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-bold text-sm"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Transfer Type</label>
                    <select
                      value={transferForm.transfer_type}
                      onChange={(e) => setTransferForm({ ...transferForm, transfer_type: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-bold"
                    >
                      <option value="admin_credit">Admin Credit (Add to Wallet)</option>
                      <option value="admin_debit">Admin Debit (Deduct from Wallet)</option>
                    </select>
                  </div>
                </>
              )}

              <div className="pt-2 flex justify-end space-x-2">
                <button type="button" onClick={() => setShowTransferModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-[#ff5722] hover:bg-[#f4511e] text-white rounded-xl font-bold shadow-md">
                  Execute Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: EMPLOYEE WITH ROLE-BASED PERMISSIONS MATRIX     */}
      {/* ======================================================== */}
      {showEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {editingEmployee ? 'Edit Staff Permissions' : 'Register New Employee & Role Permissions'}
                </h3>
                <p className="text-[11px] text-slate-500">Configure role-based access to admin modules</p>
              </div>
              <button onClick={() => setShowEmployeeModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (editingEmployee) {
                  await updateAdminEmployee(editingEmployee.id, employeeForm);
                } else {
                  await storeAdminEmployee(employeeForm);
                }
                setShowEmployeeModal(false);
                fetchData();
              }}
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Staff Full Name *</label>
                  <input
                    type="text"
                    required
                    value={employeeForm.name}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Department / Role</label>
                  <select
                    value={employeeForm.department}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-bold"
                  >
                    <option value="Operations">Operations</option>
                    <option value="Finance">Finance</option>
                    <option value="Support">Support</option>
                    <option value="Inventory">Inventory</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Work Email *</label>
                  <input
                    type="email"
                    required
                    disabled={!!editingEmployee}
                    value={employeeForm.email}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={employeeForm.phone}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium"
                  />
                </div>
              </div>

              {!editingEmployee && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Login Password *</label>
                  <input
                    type="password"
                    required
                    value={employeeForm.password}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium"
                  />
                </div>
              )}

              {/* Granular Module Permissions Matrix */}
              <div className="space-y-2 pt-2 border-t">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Assigned Module Access Permissions (User-Base Role Permissions):
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {menuItems.map((m) => (
                    <label
                      key={m.key}
                      className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl border cursor-pointer hover:bg-slate-100"
                    >
                      <input
                        type="checkbox"
                        checked={!!employeeForm.permissions[m.key.replace('-', '_')]}
                        onChange={(e) => setEmployeeForm({
                          ...employeeForm,
                          permissions: {
                            ...employeeForm.permissions,
                            [m.key.replace('-', '_')]: e.target.checked,
                          },
                        })}
                        className="rounded text-[#ff5722] focus:ring-[#ff5722]"
                      />
                      <span className="text-[11px] font-bold text-slate-700">{m.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button type="button" onClick={() => setShowEmployeeModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-[#ff5722] hover:bg-[#f4511e] text-white rounded-xl font-bold shadow-md">
                  Save Employee Permissions
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: ADD PROMOTIONAL BANNER                          */}
      {/* ======================================================== */}
      {showBannerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="text-base font-black text-slate-900">Add Promotional Banner</h3>
              <button onClick={() => setShowBannerModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await storeAdminBanner(bannerForm);
                setShowBannerModal(false);
                fetchData();
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Banner Title *</label>
                <input
                  type="text"
                  required
                  value={bannerForm.title}
                  onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Subtitle / Promo Tag</label>
                <input
                  type="text"
                  value={bannerForm.subtitle}
                  onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Banner Image URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={bannerForm.image}
                  onChange={(e) => setBannerForm({ ...bannerForm, image: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-mono text-[11px]"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Link URL</label>
                <input
                  type="text"
                  value={bannerForm.link}
                  onChange={(e) => setBannerForm({ ...bannerForm, link: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium"
                />
              </div>
              <div className="pt-2 flex justify-end space-x-2">
                <button type="button" onClick={() => setShowBannerModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-[#ff5722] hover:bg-[#f4511e] text-white rounded-xl font-bold shadow-md">
                  Save Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: RESET PASSWORD                                    */}
      {/* ======================================================== */}
      {showPasswordModal && passwordTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h3 className="text-base font-black text-slate-900">Reset Member Password</h3>
                <p className="text-[11px] text-slate-500 font-medium">User: {passwordTargetUser.name} ({passwordTargetUser.referral_code})</p>
              </div>
              <button onClick={() => setShowPasswordModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePasswordResetSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">New Password *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter new password (min 6 characters)"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl font-mono text-sm focus:outline-none focus:bg-white"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 space-y-1">
                <p className="font-bold">⚠️ Note for Super Admin:</p>
                <p>This will immediately update the login password for {passwordTargetUser.email}.</p>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button type="button" onClick={() => setShowPasswordModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-[#ff5722] hover:bg-[#f4511e] text-white rounded-xl font-bold shadow-md">
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: MOVE / TRANSFER USER DOWNLINE                     */}
      {/* ======================================================== */}
      {showTransferUserModal && transferTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h3 className="text-base font-black text-slate-900">Move / Transfer Member ID</h3>
                <p className="text-[11px] text-slate-500 font-medium">Reassign {transferTargetUser.name} ({transferTargetUser.role})</p>
              </div>
              <button onClick={() => setShowTransferUserModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransferUserSubmit} className="space-y-3.5 text-xs">
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-[11px] text-blue-900">
                <p className="font-bold">Current Team Info:</p>
                <p>State: <span className="font-bold">{transferTargetUser.state || 'GUJRAT'}</span> | City: {transferTargetUser.city || 'Surat'} | Upline: {transferTargetUser.sponsor?.name || 'Direct'}</p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">New Sponsor Referral Code</label>
                <input
                  type="text"
                  placeholder="e.g. SUPER100, ADM1001"
                  value={transferUserForm.new_sponsor_code}
                  onChange={(e) => setTransferUserForm({ ...transferUserForm, new_sponsor_code: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl font-mono uppercase font-bold"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">Leave blank to keep current sponsor</span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Assign State (Team Hub) *</label>
                <select
                  required
                  value={transferUserForm.new_state}
                  onChange={(e) => setTransferUserForm({ ...transferUserForm, new_state: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl font-bold text-slate-800"
                >
                  {INDIAN_STATES.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">City</label>
                  <input
                    type="text"
                    value={transferUserForm.new_city}
                    onChange={(e) => setTransferUserForm({ ...transferUserForm, new_city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pincode</label>
                  <input
                    type="text"
                    value={transferUserForm.new_pincode}
                    onChange={(e) => setTransferUserForm({ ...transferUserForm, new_pincode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button type="button" onClick={() => setShowTransferUserModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-[#ff5722] hover:bg-[#f4511e] text-white rounded-xl font-bold shadow-md">
                  Execute Move
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: STATE-WISE WHOLESALE PRICING                      */}
      {/* ======================================================== */}
      {showStatePriceModal && statePriceProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full p-6 space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h3 className="text-base font-black text-slate-900">State-Wise Wholesale Pricing</h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Product: <span className="font-bold text-slate-900">{statePriceProduct.name}</span> • Default Wholesale: ₹{statePriceProduct.wholesale_price || '0.00'} • MRP: ₹{statePriceProduct.mrp}
                </p>
              </div>
              <button onClick={() => setShowStatePriceModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStatePricesSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 flex items-center justify-between">
                <div>
                  <span className="font-bold block text-xs">⚡ State-Specific B2B Pricing Active</span>
                  <span className="text-[11px] text-emerald-700">Orders &amp; Purchase Orders placed from each state will automatically apply that state's wholesale rate.</span>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-2xl max-h-96 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] sticky top-0">
                    <tr>
                      <th className="p-3">State Name</th>
                      <th className="p-3">Wholesale Rate (₹)</th>
                      <th className="p-3">Retail Price (₹)</th>
                      <th className="p-3">MRP (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {statePriceRows.map((row, idx) => (
                      <tr key={row.state} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-800 flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                          <span>{row.state}</span>
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={row.wholesale_price}
                            onChange={(e) => {
                              const newRows = [...statePriceRows];
                              newRows[idx].wholesale_price = parseFloat(e.target.value) || 0;
                              setStatePriceRows(newRows);
                            }}
                            className="w-28 px-2.5 py-1.5 bg-slate-50 border rounded-lg font-black text-emerald-700 focus:bg-white"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            step="0.01"
                            value={row.retail_price}
                            onChange={(e) => {
                              const newRows = [...statePriceRows];
                              newRows[idx].retail_price = parseFloat(e.target.value) || 0;
                              setStatePriceRows(newRows);
                            }}
                            className="w-28 px-2.5 py-1.5 bg-slate-50 border rounded-lg font-semibold focus:bg-white"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            step="0.01"
                            value={row.mrp}
                            onChange={(e) => {
                              const newRows = [...statePriceRows];
                              newRows[idx].mrp = parseFloat(e.target.value) || 0;
                              setStatePriceRows(newRows);
                            }}
                            className="w-28 px-2.5 py-1.5 bg-slate-50 border rounded-lg font-semibold focus:bg-white"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button type="button" onClick={() => setShowStatePriceModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md">
                  Save All State Prices
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: MEDICINE PURCHASE ORDER (PO) REVIEW & APPROVAL    */}
      {/* ======================================================== */}
      {showPOModal && selectedPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-6 space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h3 className="text-base font-black text-slate-900">Purchase Order Review: #{selectedPO.po_number}</h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Partner: <span className="font-bold text-slate-900">{selectedPO.user?.name}</span> ({selectedPO.user?.role}) • State: <span className="font-bold text-emerald-700">{selectedPO.state || 'GUJRAT'}</span>
                </p>
              </div>
              <button onClick={() => setShowPOModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-blue-900 block text-xs">Medicine Batch Order Verification</span>
                  <span className="text-[11px] text-blue-700">Adjust the approved medicine quantities below. Super Admin approval will instantly generate the final GST Tax Invoice.</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                  selectedPO.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                  selectedPO.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {selectedPO.status}
                </span>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Medicine &amp; Pack</th>
                      <th className="p-3 text-center">Requested Qty</th>
                      <th className="p-3 text-center">Approved Qty</th>
                      <th className="p-3 text-right">State Wholesale Rate</th>
                      <th className="p-3 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedPO.items?.map((item) => {
                      const appQty = poApprovalQuantities[item.id] !== undefined ? poApprovalQuantities[item.id] : (item.approved_quantity > 0 ? item.approved_quantity : item.requested_quantity);
                      const itemTot = (item.unit_price * appQty).toFixed(2);
                      return (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="p-3">
                            <span className="font-bold text-slate-900 block">{item.product?.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{item.product?.composition || item.product?.dosage_form}</span>
                          </td>
                          <td className="p-3 text-center font-bold text-slate-600">
                            {item.requested_quantity}
                          </td>
                          <td className="p-3 text-center">
                            {selectedPO.status === 'pending' ? (
                              <input
                                type="number"
                                min="0"
                                max={item.requested_quantity}
                                value={appQty}
                                onChange={(e) => setPoApprovalQuantities({ ...poApprovalQuantities, [item.id]: parseInt(e.target.value) || 0 })}
                                className="w-20 px-2 py-1 bg-slate-50 border rounded-lg text-center font-black text-emerald-700"
                              />
                            ) : (
                              <span className="font-black text-emerald-700">{item.approved_quantity}</span>
                            )}
                          </td>
                          <td className="p-3 text-right font-semibold text-slate-700">
                            ₹{Number(item.unit_price).toFixed(2)}
                          </td>
                          <td className="p-3 text-right font-black text-slate-900">
                            ₹{itemTot}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Super Admin Dispatch / Verification Notes</label>
                <textarea
                  rows={2}
                  disabled={selectedPO.status !== 'pending'}
                  placeholder="e.g., Batch verified, dispatched from Surat hub via cold chain transport"
                  value={poAdminNotes}
                  onChange={(e) => setPoAdminNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium"
                />
              </div>

              <div className="pt-3 border-t flex items-center justify-between">
                <div>
                  {selectedPO.order_id && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowPOModal(false);
                        setSelectedInvoiceOrderId(selectedPO.order_id);
                      }}
                      className="bg-brand-orange-50 text-brand-orange-600 border border-brand-orange-200 px-4 py-2 rounded-xl font-bold flex items-center space-x-1.5"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print Official GST Tax Invoice</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button type="button" onClick={() => setShowPOModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold">
                    Close
                  </button>
                  {selectedPO.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        onClick={handleRejectPOSubmit}
                        className="px-4 py-2 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-xl font-bold"
                      >
                        Reject PO
                      </button>
                      <button
                        type="button"
                        onClick={handleApprovePOSubmit}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md flex items-center space-x-1.5"
                      >
                        <CheckCheck className="w-4 h-4" />
                        <span>Approve PO &amp; Issue Tax Invoice</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
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
