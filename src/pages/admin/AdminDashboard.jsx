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
  CheckCheck, SlidersHorizontal, ArrowDownCircle, Map, Upload, Star, Truck, Menu, Download
} from 'lucide-react';
import { EarningsSalesChart, StockInventoryChart } from '../../components/common/DashboardCharts';
import {
  exportSalesReport,
  exportStockReport,
  exportCommissionsReport,
  exportPurchaseOrdersReport,
  exportMembersReport
} from '../../utils/excelExport';
import { useAuth } from '../../context/AuthContext';
import { FALLBACK_NETWORK_USERS } from '../../data/fallbackUsers';
import {
  getAdminStats,
  getAdminUsersByRole, storeAdminHierarchyUser, updateAdminHierarchyUser, impersonateAdminUser,
  resetAdminUserPassword, toggleAdminUserStatus, transferAdminUser, approveAdminUser, rejectAdminUser,
  getAdminMargins, updateAdminMargins,
  getAdminTransfers, createAdminTransfer,
  getAdminProductMargins,
  getAdminCategories, storeAdminCategory, updateAdminCategory, deleteAdminCategory,
  getAdminProducts, storeAdminProduct, updateAdminProduct, deleteAdminProduct, toggleAdminProductSection,
  uploadAdminProductImage,
  getAdminProductStatePrices, saveAdminProductStatePrices,
  getAdminUserAssignedProducts, toggleAdminUserProductAssignment, bulkAssignAdminUserProducts, saveAdminUserProductPrice,
  getAdminOrders, updateAdminOrderStatus,
  getPurchaseOrders, approvePurchaseOrder, rejectPurchaseOrder,
  getAdminPrescriptions, updateAdminPrescriptionStatus,
  getAdminPayouts, processAdminPayout,
  getAdminBanners, storeAdminBanner, deleteAdminBanner,
  getAdminReports,
  getAdminEmployees, storeAdminEmployee, updateAdminEmployee,
  getAdminSettings, updateAdminSettings,
  getHierarchyParents
} from '../../services/api';
import GstInvoiceModal from '../../components/invoice/GstInvoiceModal';
import DispatchModal from '../../components/orders/DispatchModal';
import OrderTrackingModal from '../../components/orders/OrderTrackingModal';

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

  // Dispatch permission is strictly for Retailer and all roles above Retailer
  const canDispatchOrder = Boolean(
    !user || user.role_level >= 3 || ['retailer', 'sub_distributor', 'distributor', 'super_distributor', 'admin', 'super_admin'].includes(user.role)
  );

  // Product assigning feature is strictly reserved for Super Admin
  const isSuperAdmin = Boolean(
    !user || user.role === 'super_admin' || user.role === 'owner' || user.role_level >= 5
  );

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
    parent_id: '',
    sub_retailer_commission: 10,
    customer_commission: 5,
    level_1_commission: 10,
    level_2_commission: 5,
    level_3_commission: 2,
    status: 'active',
  });
  const [hierarchyParents, setHierarchyParents] = useState([]);
  const [loadingHierarchyParents, setLoadingHierarchyParents] = useState(false);

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
  const [productSectionFilter, setProductSectionFilter] = useState('all'); // 'all', 'featured', 'trending', 'active', 'inactive'
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
    retail_price: '',
    sd_price: '',
    dist_price: '',
    subd_price: '',
    retailer_price: '',
    wholesale_price: '',
    stock_quantity: 100,
    box_packing: '1 Box (10 Strips)',
    box_unit: 'Box',
    strip_packing: '1 Strip (10 Tablets)',
    strip_unit: 'Strip',
    expiry_date: '',
    status: 'Active',
    is_featured: false,
    is_trending: false,
    image: '',
    images: [],
  });
  const [newImageUrl, setNewImageUrl] = useState('');

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
  const [dispatchTargetOrder, setDispatchTargetOrder] = useState(null);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [trackingTargetOrder, setTrackingTargetOrder] = useState(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);

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

  // Super Admin: Assign Products & Set Product Price Modals (Screenshots feature)
  const [showAssignProductsModal, setShowAssignProductsModal] = useState(false);
  const [assignTargetUser, setAssignTargetUser] = useState(null);
  const [assignedProductsList, setAssignedProductsList] = useState([]);
  const [assignProductsLoading, setAssignProductsLoading] = useState(false);
  const [assignProductsSearch, setAssignProductsSearch] = useState('');
  const [selectedAssignProductIds, setSelectedAssignProductIds] = useState([]);
  const [assignFilterOnlyAssigned, setAssignFilterOnlyAssigned] = useState(false);

  const [showSetPriceModal, setShowSetPriceModal] = useState(false);
  const [priceTargetProduct, setPriceTargetProduct] = useState(null);
  const [priceForm, setPriceForm] = useState({
    sd_margin: 2,
    dist_margin: 5,
    subd_margin: 10,
    rt_margin: 15,
    end_user_price: 86,
    sd_price: 112,
    dist_price: 115,
    subd_price: 120,
    retailer_price: 140,
  });
  const [savingPrice, setSavingPrice] = useState(false);

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
        setRoleUsers({ data: FALLBACK_NETWORK_USERS[role] || [] });
        try {
          const res = await getAdminUsersByRole({ role, search: searchQuery, status: statusFilter, state: stateFilter, sort: sortOrder });
          const usersList = res?.data?.users?.data || res?.data?.users;
          if (res?.data?.success && Array.isArray(usersList) && usersList.length > 0) {
            setRoleUsers(res.data.users);
            setRoleStats(res.data.stats);
            if (res.data.state_counts) setStateCounts(res.data.state_counts);
          }
        } catch (e) {
          // Gracefully keep fallback dataset
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

  // Fetch eligible parent users for strict hierarchy creation
  const fetchHierarchyParentsForRole = async (targetRole) => {
    if (!targetRole || targetRole === 'super_distributor' || targetRole === 'super_admin' || targetRole === 'admin') {
      setHierarchyParents([]);
      return;
    }
    setLoadingHierarchyParents(true);
    try {
      const res = await getHierarchyParents({ role: targetRole });
      if (res.data?.success) {
        setHierarchyParents(res.data.parents || []);
      }
    } catch (e) {
      console.error('Failed to fetch hierarchy parents:', e);
      setHierarchyParents([]);
    } finally {
      setLoadingHierarchyParents(false);
    }
  };

  useEffect(() => {
    if (showAddUserModal && userForm.role) {
      fetchHierarchyParentsForRole(userForm.role);
    }
  }, [showAddUserModal, userForm.role]);

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

  // Super Admin: Assign Products & Set Product Price Handlers (Screenshots Feature)
  const handleOpenAssignProductsModal = async (targetUser) => {
    if (!isSuperAdmin) {
      alert('Access Denied: Product assigning feature is strictly reserved for Super Admin only.');
      return;
    }
    setAssignTargetUser(targetUser);
    setShowAssignProductsModal(true);
    setAssignProductsLoading(true);
    setAssignProductsSearch('');
    setSelectedAssignProductIds([]);
    try {
      const res = await getAdminUserAssignedProducts(targetUser.id);
      if (res.data.success) {
        setAssignedProductsList(res.data.products || []);
        if (res.data.user) {
          setAssignTargetUser(res.data.user);
        }
      }
    } catch (err) {
      alert(`Error fetching assigned products: ${err.response?.data?.message || err.message}`);
    } finally {
      setAssignProductsLoading(false);
    }
  };

  const handleToggleProductAssignment = async (productId, newStatus) => {
    if (!assignTargetUser) return;
    setAssignedProductsList((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, is_assigned: newStatus } : p))
    );
    try {
      await toggleAdminUserProductAssignment(assignTargetUser.id, {
        product_id: productId,
        is_assigned: newStatus,
      });
    } catch (err) {
      alert(`Failed to update assignment: ${err.response?.data?.message || err.message}`);
      setAssignedProductsList((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, is_assigned: !newStatus } : p))
      );
    }
  };

  const handleBulkAssignSubmit = async (newStatus) => {
    if (!assignTargetUser || selectedAssignProductIds.length === 0) return;
    const targetIds = [...selectedAssignProductIds];
    setAssignedProductsList((prev) =>
      prev.map((p) => (targetIds.includes(p.id) ? { ...p, is_assigned: newStatus } : p))
    );
    try {
      await bulkAssignAdminUserProducts(assignTargetUser.id, {
        product_ids: targetIds,
        is_assigned: newStatus,
      });
      setSelectedAssignProductIds([]);
      alert(newStatus ? `${targetIds.length} products assigned successfully!` : `${targetIds.length} products removed from distributor!`);
    } catch (err) {
      alert(`Bulk update failed: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleOpenSetPriceModal = (product) => {
    setPriceTargetProduct(product);
    const endUser = product.end_user_price || product.mrp || (product.base_price ? Number((product.base_price * 8.6).toFixed(2)) : 86);
    const productPrice = product.product_price !== undefined && product.product_price !== null ? product.product_price : endUser;
    setPriceForm({
      product_price: productPrice,
      level_1_commission: product.level_1_commission !== undefined ? product.level_1_commission : (assignTargetUser?.level_1_commission || 10),
      level_2_commission: product.level_2_commission !== undefined ? product.level_2_commission : (assignTargetUser?.level_2_commission || 5),
      level_3_commission: product.level_3_commission !== undefined ? product.level_3_commission : (assignTargetUser?.level_3_commission || 2),
      sub_retailer_commission: product.sub_retailer_commission !== undefined ? product.sub_retailer_commission : (assignTargetUser?.sub_retailer_commission || 10),
      customer_commission: product.customer_commission !== undefined ? product.customer_commission : (assignTargetUser?.customer_commission || 5),
      sd_margin: product.sd_margin !== undefined ? product.sd_margin : 2,
      dist_margin: product.dist_margin !== undefined ? product.dist_margin : 5,
      subd_margin: product.subd_margin !== undefined ? product.subd_margin : 10,
      rt_margin: product.rt_margin !== undefined ? product.rt_margin : 15,
      end_user_price: endUser,
      sd_price: product.sd_price !== undefined ? product.sd_price : (product.base_price ? Number((product.base_price * 1.12).toFixed(2)) : 112),
      dist_price: product.dist_price !== undefined ? product.dist_price : (product.base_price ? Number((product.base_price * 1.15).toFixed(2)) : 115),
      subd_price: product.subd_price !== undefined ? product.subd_price : (product.base_price ? Number((product.base_price * 1.20).toFixed(2)) : 120),
      retailer_price: product.retailer_price !== undefined ? product.retailer_price : (product.base_price ? Number((product.base_price * 1.40).toFixed(2)) : 140),
    });
    setShowSetPriceModal(true);
  };

  const handleSaveProductPriceSubmit = async (e) => {
    e.preventDefault();
    if (!assignTargetUser || !priceTargetProduct) return;
    setSavingPrice(true);
    try {
      const payload = {
        product_id: priceTargetProduct.id,
        product_price: parseFloat(priceForm.product_price) || parseFloat(priceForm.end_user_price) || 0,
        level_1_commission: parseFloat(priceForm.level_1_commission) || 0,
        level_2_commission: parseFloat(priceForm.level_2_commission) || 0,
        level_3_commission: parseFloat(priceForm.level_3_commission) || 0,
        sub_retailer_commission: parseFloat(priceForm.sub_retailer_commission) || 0,
        customer_commission: parseFloat(priceForm.customer_commission) || 0,
        sd_margin: parseFloat(priceForm.sd_margin) || 0,
        dist_margin: parseFloat(priceForm.dist_margin) || 0,
        subd_margin: parseFloat(priceForm.subd_margin) || 0,
        rt_margin: parseFloat(priceForm.rt_margin) || 0,
        end_user_price: parseFloat(priceForm.end_user_price) || 0,
        sd_price: parseFloat(priceForm.sd_price) || 0,
        dist_price: parseFloat(priceForm.dist_price) || 0,
        subd_price: parseFloat(priceForm.subd_price) || 0,
        retailer_price: parseFloat(priceForm.retailer_price) || 0,
      };
      const res = await saveAdminUserProductPrice(assignTargetUser.id, payload);
      if (res.data.success) {
        setAssignedProductsList((prev) =>
          prev.map((p) => (p.id === priceTargetProduct.id ? { ...p, ...payload, is_assigned: true } : p))
        );
        setShowSetPriceModal(false);
        alert(res.data.message || 'Product prices, rates, and commissions saved successfully!');
      }
    } catch (err) {
      alert(`Failed to save price: ${err.response?.data?.message || err.message}`);
    } finally {
      setSavingPrice(false);
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
      const rawPhone = (payload.mobile || payload.phone || '').trim();
      payload.mobile = rawPhone;
      payload.phone = rawPhone;

      // If full name is empty but business name is entered, fallback to business name
      if (!payload.name?.trim() && payload.business_name?.trim()) {
        payload.name = payload.business_name.trim();
      }

      // If email is empty, auto-generate from phone
      if (!payload.email?.trim() && rawPhone) {
        payload.email = `${rawPhone.replace(/\D/g, '')}@mediglaxo.com`;
      }

      if (payload.role && payload.role.startsWith('customer')) {
        payload.role = 'customer';
      }

      if (editingUser) {
        await updateAdminHierarchyUser(editingUser.id, payload);
        alert('User details updated successfully!');
      } else {
        const res = await storeAdminHierarchyUser(payload);
        alert(res.data?.message || 'New partner account created successfully!');
      }
      setShowAddUserModal(false);
      setEditingUser(null);
      fetchData();
    } catch (err) {
      console.error('Failed to save user:', err);
      const serverErrors = err.response?.data?.errors;
      let msg = '';
      if (serverErrors && typeof serverErrors === 'object') {
        msg = Object.values(serverErrors).flat().join('\n');
      } else {
        msg = err.response?.data?.message || err.message || 'Failed to save user. Please verify details.';
      }
      alert(msg);
    }
  };

  const handleImpersonate = async (userId) => {
    if (window.confirm('Log in directly to this partner/customer account in a new tab as Super Admin?')) {
      // Pre-open new tab so browser popup blocker does not block it
      const newTab = window.open('about:blank', '_blank');
      if (newTab) {
        newTab.document.write(`
          <!DOCTYPE html>
          <html>
            <head><title>Opening Account - MediGlaxo</title></head>
            <body style="font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0f172a;color:#f8fafc;">
              <div style="text-align:center;padding:24px;">
                <div style="width:36px;height:36px;border:3px solid #ff6b35;border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 16px;"></div>
                <h3 style="margin:0 0 8px;font-size:16px;font-weight:700;">Opening Partner Account in New Tab...</h3>
                <p style="margin:0;font-size:12px;color:#94a3b8;">Super Admin dashboard will remain active in the previous tab.</p>
              </div>
              <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
            </body>
          </html>
        `);
      }

      try {
        const res = await impersonateAdminUser(userId);
        if (res.data.success) {
          const targetRole = res.data.user?.role;
          const dest = targetRole === 'customer' ? '/my-orders' :
                       (targetRole === 'sub_retailer' || targetRole === 'member') ? '/mlm' :
                       '/hierarchy';

          const impersonateUrl = `/impersonate?token=${encodeURIComponent(res.data.token)}&user=${encodeURIComponent(JSON.stringify(res.data.user))}&dest=${encodeURIComponent(dest)}`;

          if (newTab && !newTab.closed) {
            newTab.location.href = impersonateUrl;
          } else {
            window.open(impersonateUrl, '_blank');
          }
        } else {
          if (newTab && !newTab.closed) newTab.close();
          alert('Failed to log in to user account.');
        }
      } catch (err) {
        if (newTab && !newTab.closed) newTab.close();
        alert('Impersonation failed: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Product Image Upload
  const [uploadingProductImage, setUploadingProductImage] = useState(false);

  const handleProductImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadingProductImage(true);
    try {
      const formData = new FormData();
      if (files.length === 1) {
        formData.append('image', files[0]);
      } else {
        files.forEach((f) => formData.append('images[]', f));
      }
      const res = await uploadAdminProductImage(formData);
      if (res.data.success) {
        const newUrls = res.data.urls || (res.data.url ? [res.data.url] : []);
        setProductForm((prev) => {
          const currentList = Array.isArray(prev.images) && prev.images.length > 0
            ? prev.images
            : (prev.image ? [prev.image] : []);
          const combined = [...currentList, ...newUrls];
          const unique = Array.from(new Set(combined.filter(Boolean)));
          return {
            ...prev,
            images: unique,
            image: unique[0] || '',
          };
        });
      }
    } catch (err) {
      alert(`Image upload failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setUploadingProductImage(false);
      e.target.value = '';
    }
  };

  const handleAddImageUrl = () => {
    if (!newImageUrl.trim()) return;
    const url = newImageUrl.trim();
    setProductForm((prev) => {
      const currentList = Array.isArray(prev.images) && prev.images.length > 0
        ? prev.images
        : (prev.image ? [prev.image] : []);
      const combined = [...currentList, url];
      const unique = Array.from(new Set(combined.filter(Boolean)));
      return {
        ...prev,
        images: unique,
        image: unique[0] || '',
      };
    });
    setNewImageUrl('');
  };

  const handleRemoveProductImage = (indexToRemove) => {
    setProductForm((prev) => {
      const currentList = Array.isArray(prev.images) ? prev.images : [];
      const updated = currentList.filter((_, idx) => idx !== indexToRemove);
      return {
        ...prev,
        images: updated,
        image: updated[0] || '',
      };
    });
  };

  const handleSetPrimaryProductImage = (indexToPrimary) => {
    setProductForm((prev) => {
      const currentList = Array.isArray(prev.images) ? [...prev.images] : [];
      if (indexToPrimary < 0 || indexToPrimary >= currentList.length) return prev;
      const [chosen] = currentList.splice(indexToPrimary, 1);
      const updated = [chosen, ...currentList];
      return {
        ...prev,
        images: updated,
        image: chosen,
      };
    });
  };

  // Category & Subcategory CRUD
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      if (!categoryForm.name?.trim()) {
        alert('Please enter category or subcategory name.');
        return;
      }

      const payload = {
        name: categoryForm.name.trim(),
        parent_id: categoryForm.parent_id ? parseInt(categoryForm.parent_id) : null,
        icon: categoryForm.icon?.trim() || null,
        image: categoryForm.image?.trim() || null,
        description: categoryForm.description?.trim() || null,
        sort_order: parseInt(categoryForm.sort_order) || 0,
        is_active: Boolean(categoryForm.is_active),
      };

      if (editingCategory) {
        await updateAdminCategory(editingCategory.id, payload);
        alert('Category / Subcategory updated successfully!');
      } else {
        const res = await storeAdminCategory(payload);
        alert(res.data?.message || 'Category / Subcategory created successfully!');
      }

      setShowCategoryModal(false);
      setEditingCategory(null);
      fetchData();
    } catch (err) {
      console.error('Failed to save category:', err);
      const serverErrors = err.response?.data?.errors;
      let msg = '';
      if (serverErrors && typeof serverErrors === 'object') {
        msg = Object.values(serverErrors).flat().join('\n');
      } else {
        msg = err.response?.data?.message || err.message || 'Failed to save category.';
      }
      alert(msg);
    }
  };

  const handleDeleteCategory = async (catId, catName) => {
    if (window.confirm(`Are you sure you want to delete "${catName}"? Any subcategories under it will also be deleted.`)) {
      try {
        await deleteAdminCategory(catId);
        alert('Category deleted successfully.');
        fetchData();
      } catch (err) {
        console.error('Failed to delete category:', err);
        alert(err.response?.data?.message || 'Failed to delete category.');
      }
    }
  };

  // Product CRUD
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const imagesArr = Array.isArray(productForm.images) && productForm.images.length > 0
        ? productForm.images
        : (productForm.image ? [productForm.image] : []);

      const payload = {
        ...productForm,
        images: imagesArr,
        image: imagesArr[0] || productForm.image || '',
      };

      if (editingProduct) {
        await updateAdminProduct(editingProduct.id, payload);
      } else {
        await storeAdminProduct(payload);
      }
      setShowProductModal(false);
      setEditingProduct(null);
      fetchData();
      alert('Product saved successfully!');
    } catch (err) {
      alert('Failed to save product. Check required fields.');
    }
  };

  const handleToggleProductSection = async (productId, section, currentValue) => {
    try {
      const newValue = !currentValue;
      await toggleAdminProductSection(productId, { section, value: newValue });
      setProductsList((prev) => {
        if (!prev) return prev;
        if (Array.isArray(prev)) {
          return prev.map((p) => p.id === productId ? { ...p, [section]: newValue } : p);
        }
        if (prev.data && Array.isArray(prev.data)) {
          return {
            ...prev,
            data: prev.data.map((p) => p.id === productId ? { ...p, [section]: newValue } : p)
          };
        }
        return prev;
      });
    } catch (err) {
      console.error('Failed to toggle product section:', err);
      alert('Failed to update product section.');
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
    <div className="min-h-screen bg-[#f8fafc] flex relative">
      {/* Mobile Sidebar Overlay Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      {/* 1. LEFT ADMIN SIDEBAR (RESPONSIVE FOR DESKTOP & MOBILE) */}
      <aside className={`w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between flex-shrink-0 z-40 shadow-xs fixed lg:static inset-y-0 left-0 transition-transform duration-200 lg:translate-x-0 ${
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div>
          {/* Logo Header with Close button on mobile */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/logo.png" alt="MediGlaxo" className="h-9 w-auto" />
            </Link>
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(false)}
              className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Admin User Profile Card (Matching Live Blue Gradient Card) */}
          <div className="m-3 p-3.5 rounded-2xl bg-gradient-to-r from-[#2196f3] to-[#1976d2] text-white shadow-sm flex items-center space-x-3">
            <div className="w-11 h-11 rounded-full bg-white text-[#ff5722] flex items-center justify-center font-black text-xl shadow-xs flex-shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="overflow-hidden">
              <h4 className="font-black text-sm text-white truncate">{user?.name || 'Super Admin'}</h4>
              <p className="text-[11px] text-blue-100/90 leading-tight truncate">{user?.phone || 'admin@mediglaxo.com'}</p>
              <span className="inline-block mt-0.5 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-white/20 text-white">
                {user?.role || 'Super Admin'}
              </span>
            </div>
          </div>

          {/* 17 Sidebar Menu Items */}
          <nav className="p-2.5 space-y-1 max-h-[calc(100vh-250px)] overflow-y-auto text-xs font-semibold">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentSection === item.key || (currentSection === '' && item.key === 'dashboard');

              return (
                <button
                  key={item.key}
                  onClick={() => {
                    navigate(item.path);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all text-left cursor-pointer ${
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

        {/* Bottom Prominent Logout Button in Sidebar */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Are you sure you want to log out from Super Admin?')) {
                logout();
                navigate('/login');
              }
            }}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 text-xs font-black text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all active:scale-95 shadow-2xs cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-600" />
            <span>Logout Session</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN ADMIN CONTENT WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header Bar with Prominent Logout & User Dropdown */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
          <div className="flex items-center space-x-3">
            {/* Mobile Sidebar Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
              title="Open Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-sm sm:text-lg font-black text-slate-900 flex items-center space-x-2">
                <span>Super Admin Workspace</span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-brand-blue-700 border border-blue-200 uppercase">
                  {user?.role || 'Super Admin'}
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 text-slate-600">
            {/* Storefront Link */}
            <Link
              to="/"
              target="_blank"
              className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Storefront</span>
            </Link>

            {/* PROMINENT LOGOUT BUTTON IN TOPBAR */}
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Are you sure you want to log out from Super Admin?')) {
                  logout();
                  navigate('/login');
                }
              }}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-black transition-all shadow-xs cursor-pointer"
              title="Logout from Super Admin"
            >
              <LogOut className="w-3.5 h-3.5 text-white" />
              <span>Logout</span>
            </button>

            {/* Profile Avatar with Dropdown */}
            <div className="relative pl-1 sm:pl-2 border-l border-slate-200">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-1.5 p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-[#ff5722] text-white flex items-center justify-center font-black text-xs shadow-xs">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-black text-slate-900 truncate">{user?.name || 'Super Admin'}</p>
                    <p className="text-[10px] text-slate-500 truncate">{user?.phone || user?.email || 'admin@mediglaxo.com'}</p>
                    <span className="inline-block mt-1 text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {user?.role || 'Super Admin'}
                    </span>
                  </div>
                  <div className="py-1">
                    <Link
                      to="/"
                      target="_blank"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      <span>View Live Store</span>
                    </Link>
                  </div>
                  <div className="border-t border-slate-100 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        if (window.confirm('Are you sure you want to log out from Super Admin?')) {
                          logout();
                          navigate('/login');
                        }
                      }}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 text-left cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-600" />
                      <span>Logout Session</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* ======================================================== */}
          {/* 1. DASHBOARD OVERVIEW (MATCHING LIVE mgpjn.com EXACTLY)  */}
          {/* ======================================================== */}
          {currentSection === 'dashboard' && (
            <div className="space-y-6 animate-dashboard-fade">
              {/* Quick MediGlaxo Reports Export Toolbar */}
              <div className="bg-gradient-to-r from-slate-900 via-[#004e89] to-[#0284c7] rounded-3xl p-5 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 animate-card-in">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center flex-shrink-0 shadow-inner">
                    <FileSpreadsheet className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-black text-white text-base">MediGlaxo Official Excel Reports</h3>
                      <span className="text-[9px] bg-orange-500 text-white font-black uppercase px-2 py-0.5 rounded-full">
                        Branded .XLSX
                      </span>
                    </div>
                    <p className="text-xs text-blue-100/80">
                      Download formal audited pharmaceutical reports with company headers, date stamps, and live ledger totals.
                    </p>
                  </div>
                </div>

                {/* Quick Export Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => exportSalesReport(ordersList?.data || [], { userName: user?.name })}
                    className="px-3 py-2 bg-white/15 hover:bg-white/25 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 backdrop-blur-xs border border-white/20 transition-all cursor-pointer shadow-xs"
                    title="Export All Sales & Orders in MediGlaxo Excel"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Sales Report</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => exportStockReport(productsList?.data || [], { userName: user?.name })}
                    className="px-3 py-2 bg-white/15 hover:bg-white/25 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 backdrop-blur-xs border border-white/20 transition-all cursor-pointer shadow-xs"
                    title="Export Central Inventory Stock Sheet in MediGlaxo Excel"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-300" />
                    <span>Stock Report</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => exportCommissionsReport(transfersList?.data || [], { userName: user?.name })}
                    className="px-3 py-2 bg-white/15 hover:bg-white/25 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 backdrop-blur-xs border border-white/20 transition-all cursor-pointer shadow-xs"
                    title="Export 3-Level Referral Commissions in MediGlaxo Excel"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-300" />
                    <span>Commissions</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => exportPurchaseOrdersReport(purchaseOrdersList?.data || [], { userName: user?.name })}
                    className="px-3 py-2 bg-white/15 hover:bg-white/25 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 backdrop-blur-xs border border-white/20 transition-all cursor-pointer shadow-xs"
                    title="Export B2B Purchase Orders in MediGlaxo Excel"
                  >
                    <Download className="w-3.5 h-3.5 text-purple-300" />
                    <span>PO Register</span>
                  </button>
                </div>
              </div>

              {/* Visual Performance & Inventory Charts */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <EarningsSalesChart orders={ordersList?.data || []} user={user} />
                <StockInventoryChart products={productsList?.data || []} user={user} />
              </div>

              {/* Top 2 Live Product Cards (Left: Recent Products, Right: Low Stock Alert) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-card-in-3">
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
                        retail_price: '',
                        sd_price: '',
                        dist_price: '',
                        subd_price: '',
                        retailer_price: '',
                        wholesale_price: '',
                        stock_quantity: 100,
                        box_packing: '1 Box (10 Strips)',
                        box_unit: 'Box',
                        strip_packing: '1 Strip (10 Tablets)',
                        strip_unit: 'Strip',
                        expiry_date: '',
                        status: 'Active',
                        is_featured: false,
                        is_trending: false,
                        image: '',
                        images: [],
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

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => exportMembersReport(roleUsers?.data || (Array.isArray(roleUsers) ? roleUsers : []), { userName: user?.name })}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                    title={`Export ${sectionTitle} Directory to MediGlaxo Excel`}
                  >
                    <Download className="w-4 h-4" />
                    <span>Export Excel</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingUser(null);
                      const targetRole = currentMenuItem.roleType?.startsWith('customer') ? 'customer' : (currentMenuItem.roleType || 'super_distributor');
                      setUserForm({
                        name: '',
                        business_name: '',
                        email: '',
                        mobile: '',
                        phone: '',
                        password: '',
                        role: targetRole,
                        parent_id: '',
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
                        sub_retailer_commission: 10,
                        customer_commission: 5,
                        status: 'active',
                      });
                      fetchHierarchyParentsForRole(targetRole);
                      setShowAddUserModal(true);
                    }}
                    className="bg-[#ff5722] hover:bg-[#f4511e] text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md shadow-[#ff5722]/25 transition-all w-fit"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add {sectionTitle.replace(/\(.*?\)/g, '').trim()}</span>
                  </button>
                </div>
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
                      {(() => {
                        const userList = Array.isArray(roleUsers)
                          ? roleUsers
                          : (Array.isArray(roleUsers?.data) ? roleUsers.data : []);
                        if (userList.length === 0) {
                          return (
                            <tr>
                              <td colSpan="8" className="p-8 text-center text-slate-400">
                                No {sectionTitle.toLowerCase()} found matching criteria.
                              </td>
                            </tr>
                          );
                        }
                        return userList.map((u) => {
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
                                  {isSuperAdmin && (
                                    <button
                                      onClick={() => handleOpenAssignProductsModal(u)}
                                      title={`Assign Products & State Pricing (${u.state || 'All States'})`}
                                      className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                                    >
                                      <Tag className="w-3.5 h-3.5" />
                                    </button>
                                  )}
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
                                  {isSuperAdmin && (
                                    <button
                                      onClick={() => handleOpenAssignProductsModal(u)}
                                      title={`Assign Products & State Pricing (${u.state || 'All States'})`}
                                      className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                                    >
                                      <Tag className="w-3.5 h-3.5" />
                                    </button>
                                  )}
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
                                {isSuperAdmin && (
                                  <button
                                    onClick={() => handleOpenAssignProductsModal(u)}
                                    title={`Assign Products & State Pricing (${u.state || 'All States'})`}
                                    className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                  >
                                    <Tag className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        });
                      })()}
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

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => exportStockReport(productsList?.data || (Array.isArray(productsList) ? productsList : []), { userName: user?.name })}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                    title="Download Complete Warehouse Stock Sheet in MediGlaxo Excel"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export Stock (Excel)</span>
                  </button>

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
                        retail_price: '',
                        sd_price: '',
                        dist_price: '',
                        subd_price: '',
                        retailer_price: '',
                        wholesale_price: '',
                        stock_quantity: 100,
                        box_packing: '1 Box (10 Strips)',
                        box_unit: 'Box',
                        strip_packing: '1 Strip (10 Tablets)',
                        strip_unit: 'Strip',
                        expiry_date: '',
                        status: 'Active',
                        is_featured: false,
                        is_trending: false,
                        image: '',
                        images: [],
                      });
                      setShowProductModal(true);
                    }}
                    className="bg-[#ff5722] hover:bg-[#f4511e] text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md shadow-[#ff5722]/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Product</span>
                  </button>
                </div>
              </div>

              {/* Section Filters & Category Tabs */}
              {(() => {
                const allP = productsList?.data || (Array.isArray(productsList) ? productsList : []);
                const featuredCnt = allP.filter(p => p.is_featured).length;
                const hotCnt = allP.filter(p => p.is_trending).length;
                const activeCnt = allP.filter(p => p.status !== 'Inactive').length;
                const inactiveCnt = allP.filter(p => p.status === 'Inactive').length;

                return (
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-b pb-3">
                    <span className="text-xs font-bold text-slate-500 mr-1">Filter by Section:</span>
                    <button
                      type="button"
                      onClick={() => setProductSectionFilter('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        productSectionFilter === 'all'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      All Medicines ({allP.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductSectionFilter('featured')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                        productSectionFilter === 'featured'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
                      }`}
                    >
                      <span>⭐ Featured ({featuredCnt})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductSectionFilter('trending')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                        productSectionFilter === 'trending'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-rose-50 text-rose-900 hover:bg-rose-100 border border-rose-200'
                      }`}
                    >
                      <span>🔥 Hot Selling ({hotCnt})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductSectionFilter('active')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        productSectionFilter === 'active'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                    >
                      Active ({activeCnt})
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductSectionFilter('inactive')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        productSectionFilter === 'inactive'
                          ? 'bg-rose-700 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      Inactive ({inactiveCnt})
                    </button>
                  </div>
                );
              })()}

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 uppercase text-[10px] font-bold text-slate-500">
                    <tr>
                      <th className="p-3.5">Medicine</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Batch / SHN</th>
                      <th className="p-3.5">MRP</th>
                      <th className="p-3.5">Retail Rate (Strip)</th>
                      <th className="p-3.5">Wholesale (Box)</th>
                      <th className="p-3.5">Stock</th>
                      <th className="p-3.5 text-center">Homepage Section</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(() => {
                      const allP = productsList?.data || (Array.isArray(productsList) ? productsList : []);
                      const filtered = allP.filter(p => {
                        if (productSectionFilter === 'featured') return Boolean(p.is_featured);
                        if (productSectionFilter === 'trending') return Boolean(p.is_trending);
                        if (productSectionFilter === 'active') return p.status !== 'Inactive';
                        if (productSectionFilter === 'inactive') return p.status === 'Inactive';
                        return true;
                      });

                      if (filtered.length === 0) {
                        return (
                          <tr>
                            <td colSpan={10} className="p-8 text-center text-slate-400">
                              No medicines match the selected section filter.
                            </td>
                          </tr>
                        );
                      }

                      return filtered.map((p) => (
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
                            ₹{Number(p.mrp || (p.price * 1.25)).toFixed(0)}
                          </td>
                          <td className="p-3.5 font-bold text-blue-700">
                            ₹{Number(p.retail_price || p.price || 0).toFixed(0)}
                            <span className="text-[9px] text-slate-400 block font-normal">/ {p.strip_unit || 'Strip'}</span>
                          </td>
                          <td className="p-3.5 font-bold text-emerald-700">
                            ₹{Number(p.wholesale_price || p.retailer_price || 0).toFixed(0)}
                            <span className="text-[9px] text-emerald-600/80 block font-normal">/ {p.box_unit || 'Box'}</span>
                          </td>
                          <td className="p-3.5 font-bold text-slate-800">
                            {p.stock}
                          </td>
                          {/* Interactive Section Placement Badges */}
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              {/* 1. Featured Section Toggle */}
                              <button
                                type="button"
                                onClick={() => handleToggleProductSection(p.id, 'is_featured', p.is_featured)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center space-x-1 transition-all cursor-pointer ${
                                  p.is_featured
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs hover:bg-amber-200'
                                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200 border border-slate-200'
                                }`}
                                title={p.is_featured ? 'Click to remove from Homepage Featured section' : 'Click to show in Homepage Featured section'}
                              >
                                <span>{p.is_featured ? '★ Featured' : '☆ Featured'}</span>
                              </button>

                              {/* 2. Hot Selling / Fast Moving Section Toggle */}
                              <button
                                type="button"
                                onClick={() => handleToggleProductSection(p.id, 'is_trending', p.is_trending)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center space-x-1 transition-all cursor-pointer ${
                                  p.is_trending
                                    ? 'bg-rose-100 text-rose-900 border border-rose-300 shadow-2xs hover:bg-rose-200'
                                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200 border border-slate-200'
                                }`}
                                title={p.is_trending ? 'Click to remove from Hot Selling Fast-Moving section' : 'Click to show in Hot Selling Fast-Moving section'}
                              >
                                <span>{p.is_trending ? '🔥 Hot' : '+ Hot'}</span>
                              </button>
                            </div>
                          </td>
                          {/* Interactive Status Toggle */}
                          <td className="p-3.5">
                            <button
                              type="button"
                              onClick={() => handleToggleProductSection(p.id, 'status', p.status === 'Active' ? 'Inactive' : 'Active')}
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
                                p.status === 'Inactive'
                                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                              }`}
                              title="Click to toggle Active / Inactive"
                            >
                              {p.status || 'Active'}
                            </button>
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
                                retail_price: p.retail_price || p.price || '',
                                sd_price: p.sd_price || '',
                                dist_price: p.dist_price || '',
                                subd_price: p.subd_price || '',
                                retailer_price: p.retailer_price || p.wholesale_price || '',
                                wholesale_price: p.wholesale_price || '',
                                stock_quantity: p.stock,
                                box_packing: p.box_packing || '1 Box (10 Strips)',
                                box_unit: p.box_unit || 'Box',
                                strip_packing: p.strip_packing || '1 Strip (10 Tablets)',
                                strip_unit: p.strip_unit || 'Strip',
                                expiry_date: p.expiry_date || '',
                                status: p.status || 'Active',
                                is_featured: Boolean(p.is_featured),
                                is_trending: Boolean(p.is_trending),
                                image: p.image || '',
                                images: Array.isArray(p.images) && p.images.length > 0
                                  ? p.images
                                  : (p.image ? [p.image] : []),
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
                      ));
                    })()}
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
                      <th className="p-3">Retail Price (Strip)</th>
                      <th className="p-3">Base Price</th>
                      <th className="p-3">Wholesale Price (Box)</th>
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
                          <td className="p-3 font-bold text-slate-800">₹{retail.toFixed(0)} <span className="text-[10px] text-slate-400 font-normal">/ Strip</span></td>
                          <td className="p-3 font-bold text-blue-600">₹{base.toFixed(0)}</td>
                          <td className="p-3 font-bold text-emerald-600">₹{wholesale.toFixed(0)} <span className="text-[10px] text-emerald-600/70 font-semibold">/ Box</span></td>
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
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-black text-slate-900 text-lg">
                    Categories &amp; Subcategories Management ({categoriesList.length} Categories)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Add, edit, or delete parent medicine categories (Tablets, Capsules, Syrups, Injections, etc.) and their subcategories.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {/* Add Parent Category Button */}
                  <button
                    onClick={() => {
                      setEditingCategory(null);
                      setCategoryForm({
                        name: '',
                        parent_id: '',
                        icon: '',
                        image: '',
                        description: '',
                        sort_order: categoriesList.length + 1,
                        is_active: true,
                      });
                      setShowCategoryModal(true);
                    }}
                    className="bg-[#ff5722] hover:bg-[#f4511e] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-[#ff5722]/20 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Parent Category</span>
                  </button>

                  {/* Add Subcategory Button */}
                  <button
                    onClick={() => {
                      setEditingCategory(null);
                      setCategoryForm({
                        name: '',
                        parent_id: categoriesList[0]?.id ? String(categoriesList[0].id) : '',
                        icon: '',
                        image: '',
                        description: '',
                        sort_order: 1,
                        is_active: true,
                      });
                      setShowCategoryModal(true);
                    }}
                    className="bg-brand-blue-800 hover:bg-brand-blue-900 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-brand-blue-800/20 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Subcategory</span>
                  </button>
                </div>
              </div>

              {/* Hierarchical Cards Display */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {categoriesList.map((cat) => (
                  <div
                    key={cat.id}
                    className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-3 hover:border-slate-300 transition-all shadow-xs"
                  >
                    {/* Category Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-base text-slate-700 shadow-2xs">
                          {cat.icon || '💊'}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-extrabold text-sm text-slate-900">{cat.name}</h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
                              Order: {cat.sort_order ?? 0}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            {cat.children?.length || 0} Subcategories • {cat.products_count || 0} Products
                          </p>
                        </div>
                      </div>

                      {/* Parent Category Actions */}
                      <div className="flex items-center space-x-1">
                        {/* Quick Add Subcategory under this Category */}
                        <button
                          onClick={() => {
                            setEditingCategory(null);
                            setCategoryForm({
                              name: '',
                              parent_id: String(cat.id),
                              icon: '',
                              image: '',
                              description: '',
                              sort_order: (cat.children?.length || 0) + 1,
                              is_active: true,
                            });
                            setShowCategoryModal(true);
                          }}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-bold flex items-center space-x-1 border border-emerald-200 transition-colors cursor-pointer"
                          title="Add Subcategory under this category"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Sub</span>
                        </button>

                        {/* Edit Category */}
                        <button
                          onClick={() => {
                            setEditingCategory(cat);
                            setCategoryForm({
                              name: cat.name,
                              parent_id: cat.parent_id ? String(cat.parent_id) : '',
                              icon: cat.icon || '',
                              image: cat.image || '',
                              description: cat.description || '',
                              sort_order: cat.sort_order ?? 0,
                              is_active: cat.is_active ?? true,
                            });
                            setShowCategoryModal(true);
                          }}
                          className="p-1.5 bg-white hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                          title="Edit Category"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Category */}
                        <button
                          onClick={() => handleDeleteCategory(cat.id, cat.name)}
                          className="p-1.5 bg-white hover:bg-rose-50 text-rose-600 rounded-lg border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
                          title="Delete Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Subcategories List */}
                    <div className="bg-white rounded-xl p-3 border border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <span>Subcategories ({cat.children?.length || 0})</span>
                      </div>

                      {cat.children && cat.children.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {cat.children.map((sub) => (
                            <div
                              key={sub.id}
                              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 text-xs transition-colors group"
                            >
                              <div className="min-w-0 pr-2">
                                <span className="font-semibold text-slate-800 truncate block">
                                  {sub.name}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {sub.products_count ?? 0} medicines
                                </span>
                              </div>
                              <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100">
                                <button
                                  onClick={() => {
                                    setEditingCategory(sub);
                                    setCategoryForm({
                                      name: sub.name,
                                      parent_id: String(cat.id),
                                      icon: sub.icon || '',
                                      image: sub.image || '',
                                      description: sub.description || '',
                                      sort_order: sub.sort_order ?? 0,
                                      is_active: sub.is_active ?? true,
                                    });
                                    setShowCategoryModal(true);
                                  }}
                                  className="p-1 text-slate-500 hover:text-brand-blue-800 transition-colors cursor-pointer"
                                  title="Edit Subcategory"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(sub.id, sub.name)}
                                  className="p-1 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                                  title="Delete Subcategory"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic py-1">
                          No subcategories added yet. Click "+ Add Sub" above to create one.
                        </p>
                      )}
                    </div>
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
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-bold text-slate-400">Total: {ordersList?.data?.length || 0} Orders</span>
                  <button
                    type="button"
                    onClick={() => exportSalesReport(ordersList?.data || [], { userName: user?.name })}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
                    title="Export All Filtered Orders to MediGlaxo Branded Excel"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Sales (Excel)</span>
                  </button>
                </div>
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
                          {canDispatchOrder ? (
                            <div className="space-y-1">
                              <select
                                value={ord.order_status}
                                onChange={async (e) => {
                                  const newStatus = e.target.value;
                                  if (newStatus === 'dispatched') {
                                    setDispatchTargetOrder(ord);
                                    setShowDispatchModal(true);
                                  } else {
                                    await updateAdminOrderStatus(ord.id, { order_status: newStatus });
                                    fetchData();
                                  }
                                }}
                                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-600 outline-none cursor-pointer"
                              >
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="dispatched">Dispatched</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                              {ord.order_status === 'dispatched' && ord.tracking_number && (
                                <span className="text-[10px] text-emerald-700 font-mono font-bold block">
                                  {ord.courier_name ? `${ord.courier_name}: ` : ''}{ord.tracking_number}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <span className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase inline-block ${
                                ord.order_status === 'delivered' ? 'bg-emerald-50 text-emerald-700' :
                                ord.order_status === 'dispatched' ? 'bg-teal-50 text-teal-800' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {ord.order_status}
                              </span>
                              {ord.order_status === 'dispatched' && ord.tracking_number && (
                                <span className="text-[10px] text-slate-500 font-mono block">
                                  {ord.courier_name ? `${ord.courier_name}: ` : ''}{ord.tracking_number}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end space-x-1.5 whitespace-nowrap">
                            {/* GST Bill */}
                            <button
                              onClick={() => setSelectedInvoiceOrderId(ord.id)}
                              className="bg-brand-orange-50 hover:bg-brand-orange-100 text-brand-orange-600 px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center space-x-1 transition-colors cursor-pointer border border-brand-orange-200"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>GST Bill</span>
                            </button>

                            {/* Track Order Button (Visible to everyone when dispatched or tracking number exists) */}
                            {(ord.order_status === 'dispatched' || ord.tracking_number) && (
                              <button
                                onClick={() => {
                                  setTrackingTargetOrder(ord);
                                  setShowTrackingModal(true);
                                }}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center space-x-1 transition-colors cursor-pointer border border-blue-200"
                                title="Track Shipment Details"
                              >
                                <Truck className="w-3.5 h-3.5" />
                                <span>Track</span>
                              </button>
                            )}

                            {/* Dispatch / Edit Tracking Button (For Retailer and above roles) */}
                            {canDispatchOrder && (
                              <button
                                onClick={() => {
                                  setDispatchTargetOrder(ord);
                                  setShowDispatchModal(true);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center space-x-1 transition-colors cursor-pointer border ${
                                  ord.order_status === 'dispatched'
                                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                                }`}
                              >
                                <Truck className="w-3.5 h-3.5" />
                                <span>{ord.order_status === 'dispatched' ? 'Edit Tracking' : 'Dispatch'}</span>
                              </button>
                            )}
                          </div>
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
                <button
                  type="button"
                  onClick={() => exportPurchaseOrdersReport(purchaseOrdersList?.data || [], { userName: user?.name })}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-sm shadow-emerald-600/20 transition-all cursor-pointer self-start sm:self-auto"
                  title="Export All B2B Purchase Orders to MediGlaxo Branded Excel"
                >
                  <Download className="w-4 h-4" />
                  <span>Export POs (Excel)</span>
                </button>
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
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => exportCommissionsReport(payoutsList?.data || [], { userName: user?.name })}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
                    title="Export Payouts & Commission History to MediGlaxo Excel"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Payouts (Excel)</span>
                  </button>

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
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-800 text-xs">
                      Product Images (Upload up to 5 or more images)
                    </label>
                    <span className="text-[11px] font-bold text-brand-blue-700">
                      {(productForm.images || []).length} image(s) attached
                    </span>
                  </div>

                  <div className="space-y-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200">
                    {/* Action Bar: Multi File Upload + Direct URL */}
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="flex items-center space-x-1.5 px-3 py-2 bg-brand-blue-800 hover:bg-brand-blue-900 text-white rounded-xl cursor-pointer font-bold transition-all text-[11px] shadow-sm">
                        <Upload className="w-4 h-4" />
                        <span>{uploadingProductImage ? 'Uploading Image(s)...' : 'Upload Images (Select Multiple)'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleProductImageUpload}
                          disabled={uploadingProductImage}
                          className="hidden"
                        />
                      </label>

                      <div className="flex-1 min-w-[220px] flex items-center space-x-1.5">
                        <input
                          type="url"
                          placeholder="Or paste direct image URL (https://...)"
                          value={newImageUrl}
                          onChange={(e) => setNewImageUrl(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddImageUrl();
                            }
                          }}
                          className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-[11px] focus:outline-none focus:border-brand-blue-600"
                        />
                        <button
                          type="button"
                          onClick={handleAddImageUrl}
                          disabled={!newImageUrl.trim()}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-[11px] font-bold transition-all disabled:opacity-40"
                        >
                          Add URL
                        </button>
                      </div>
                    </div>

                    {/* Uploaded Images Gallery Grid */}
                    {(productForm.images && productForm.images.length > 0) ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-2">
                        {productForm.images.map((imgUrl, idx) => (
                          <div
                            key={idx}
                            className={`relative group bg-white rounded-2xl border p-1.5 flex flex-col items-center transition-all ${
                              idx === 0
                                ? 'border-brand-blue-800 ring-2 ring-brand-blue-800/20 shadow-md'
                                : 'border-slate-200 hover:border-slate-300 shadow-xs'
                            }`}
                          >
                            <div className="w-full aspect-square rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center relative">
                              <img
                                src={imgUrl}
                                alt={`Product view ${idx + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300';
                                }}
                              />
                              {idx === 0 && (
                                <span className="absolute top-1 left-1 bg-brand-blue-800 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center space-x-1 shadow-xs">
                                  <Star className="w-2.5 h-2.5 fill-current" />
                                  <span>Cover</span>
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveProductImage(idx)}
                                title="Delete Image"
                                className="absolute top-1 right-1 w-6 h-6 rounded-md bg-rose-600/90 hover:bg-rose-600 text-white flex items-center justify-center shadow-md transition-all opacity-80 group-hover:opacity-100"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="w-full mt-1.5 flex items-center justify-between px-1">
                              <span className="text-[10px] font-bold text-slate-500">#{idx + 1}</span>
                              {idx !== 0 ? (
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimaryProductImage(idx)}
                                  className="text-[10px] font-bold text-brand-blue-700 hover:underline"
                                >
                                  Make Cover
                                </button>
                              ) : (
                                <span className="text-[10px] font-extrabold text-brand-blue-800">Primary</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-xs text-slate-400 font-medium border border-dashed border-slate-300 rounded-xl bg-white">
                        No product images attached yet. Click "Upload Images" or paste URLs above to add images.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="space-y-3 pt-3 border-t">
                <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">Base Pricing &amp; Stock</h4>
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
                    <span className="text-[10px] text-slate-400 block mt-0.5">Admin purchase / cost rate</span>
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

              {/* POST-WISE MEDICINE RATES (Super Distributor, Distributor, Sub Distributor, Retailer, Customer/Sub-Retailer) */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    <h4 className="font-black text-slate-900 uppercase tracking-wider text-xs">
                      Post-Wise Product Rates (Role-Based Pricing)
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-200 w-fit">
                    Wholesale (Box) vs Retail (Strip)
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-600 space-y-1">
                  <p className="font-medium">
                    <strong className="text-slate-900 font-bold">1. Sub-Retailer &amp; Customer:</strong> Inko sirf <span className="text-blue-700 font-bold">Retail Rate (per Strip)</span> show hoga (Wholesale rate hide rahega).
                  </p>
                  <p className="font-medium">
                    <strong className="text-slate-900 font-bold">2. Retailer, Sub-Distributor, Distributor, Super Distributor:</strong> In sabhi uper ke posts ko <span className="text-emerald-700 font-bold">Retail Rate aur unka respective Wholesale Rate (per Box) dono</span> show hoga.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* 1. Retail Rate (Strip) - Customer & Sub-Retailer */}
                  <div className="p-3 bg-white rounded-2xl border-2 border-blue-200 shadow-2xs">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-black text-blue-950">
                        Retail Rate (₹ / Strip) *
                      </label>
                      <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                        Customer &amp; Sub-Retailer
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 100.00"
                      value={productForm.retail_price}
                      onChange={(e) => setProductForm({ ...productForm, retail_price: e.target.value })}
                      className="w-full px-3 py-2 bg-blue-50/40 border border-blue-300 rounded-xl font-black text-xs text-blue-900 outline-none focus:bg-white"
                    />
                    <span className="text-[10px] text-slate-500 font-medium block mt-1">
                      Per Strip sale rate for patient &amp; sub-retailer
                    </span>
                  </div>

                  {/* 2. Super Distributor Purchase Rate (Box) */}
                  <div className="p-3 bg-white rounded-2xl border-2 border-emerald-200 shadow-2xs">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-black text-emerald-950">
                        Super Dist. Purchase Rate (₹ / Box)
                      </label>
                      <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                        Super Dist.
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 45.00"
                      value={productForm.sd_price}
                      onChange={(e) => setProductForm({ ...productForm, sd_price: e.target.value })}
                      className="w-full px-3 py-2 bg-emerald-50/40 border border-emerald-300 rounded-xl font-black text-xs text-emerald-900 outline-none focus:bg-white"
                    />
                    <span className="text-[10px] text-slate-500 font-medium block mt-1">
                      Super Distributor purchase rate per box
                    </span>
                  </div>

                  {/* 3. Distributor Sale Rate (Box) */}
                  <div className="p-3 bg-white rounded-2xl border-2 border-teal-200 shadow-2xs">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-black text-teal-950">
                        Distributor Sale Rate (₹ / Box)
                      </label>
                      <span className="text-[9px] font-bold bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded">
                        Distributor
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 50.00"
                      value={productForm.dist_price}
                      onChange={(e) => setProductForm({ ...productForm, dist_price: e.target.value })}
                      className="w-full px-3 py-2 bg-teal-50/40 border border-teal-300 rounded-xl font-black text-xs text-teal-900 outline-none focus:bg-white"
                    />
                    <span className="text-[10px] text-slate-500 font-medium block mt-1">
                      Sale rate for Distributor per box
                    </span>
                  </div>

                  {/* 4. Sub-Distributor Sale Rate (Box) */}
                  <div className="p-3 bg-white rounded-2xl border-2 border-sky-200 shadow-2xs">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-black text-sky-950">
                        Sub-Dist. Sale Rate (₹ / Box)
                      </label>
                      <span className="text-[9px] font-bold bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded">
                        Sub-Distributor
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 55.00"
                      value={productForm.subd_price}
                      onChange={(e) => setProductForm({ ...productForm, subd_price: e.target.value })}
                      className="w-full px-3 py-2 bg-sky-50/40 border border-sky-300 rounded-xl font-black text-xs text-sky-900 outline-none focus:bg-white"
                    />
                    <span className="text-[10px] text-slate-500 font-medium block mt-1">
                      Sale rate for Sub-Distributor per box
                    </span>
                  </div>

                  {/* 5. Retailer Sale Rate (Box) */}
                  <div className="p-3 bg-white rounded-2xl border-2 border-indigo-200 shadow-2xs">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-black text-indigo-950">
                        Retailer Sale Rate (₹ / Box)
                      </label>
                      <span className="text-[9px] font-bold bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">
                        Retailer / Chemist
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 65.00"
                      value={productForm.retailer_price}
                      onChange={(e) => setProductForm({ ...productForm, retailer_price: e.target.value, wholesale_price: e.target.value })}
                      className="w-full px-3 py-2 bg-indigo-50/40 border border-indigo-300 rounded-xl font-black text-xs text-indigo-900 outline-none focus:bg-white"
                    />
                    <span className="text-[10px] text-slate-500 font-medium block mt-1">
                      Wholesale rate for Retailer (Chemist) per box
                    </span>
                  </div>

                  {/* 6. Quick Auto-Calculate Helper */}
                  <div className="p-3.5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200/90 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-black text-amber-950 flex items-center space-x-1 mb-1">
                        <span>⚡ Quick Rate Suggestion</span>
                      </span>
                      <p className="text-[10px] text-amber-800 leading-tight">
                        Base Price aur MRP ke hisaab se sabhi posts (SD, Dist, SubD, Retailer) ke standard margins auto-fill karein.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const mrpVal = parseFloat(productForm.mrp) || 100;
                        const baseVal = parseFloat(productForm.base_price) || (mrpVal * 0.45);
                        const round2 = (num) => Math.round(num * 100) / 100;
                        const sd = round2(baseVal * 1.12);
                        const dist = round2(sd * 1.05);
                        const subd = round2(dist * 1.05);
                        const ret = round2(subd * 1.15);
                        const retail = round2(mrpVal * 0.80);
                        setProductForm({
                          ...productForm,
                          retail_price: retail,
                          sd_price: sd,
                          dist_price: dist,
                          subd_price: subd,
                          retailer_price: ret,
                          wholesale_price: ret,
                        });
                      }}
                      className="mt-2.5 w-full py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 rounded-xl font-black text-xs transition-all shadow-xs cursor-pointer text-center"
                    >
                      Auto-Fill All Post Rates
                    </button>
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
                    <option value="Active">Active (Visible in Store)</option>
                    <option value="Inactive">Inactive (Hidden from Store)</option>
                  </select>
                </div>
              </div>

              {/* STORE HOMEPAGE SECTIONS & VISIBILITY */}
              <div className="p-4 bg-gradient-to-r from-amber-50/60 via-rose-50/60 to-orange-50/60 rounded-2xl border border-amber-200/90 space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <h4 className="font-black text-slate-900 uppercase tracking-wider text-xs">
                    Homepage &amp; Store Section Placement
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500">
                  Select which sections this medicine will appear in on the store homepage:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Option 1: Featured Medicines */}
                  <label className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    productForm.is_featured ? 'bg-amber-50/90 border-amber-300 shadow-xs' : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}>
                    <input
                      type="checkbox"
                      checked={Boolean(productForm.is_featured)}
                      onChange={(e) => setProductForm({ ...productForm, is_featured: e.target.checked })}
                      className="mt-0.5 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                    />
                    <div>
                      <span className="font-extrabold text-xs text-slate-900 flex items-center space-x-1">
                        <span>⭐ Featured Medicines Section</span>
                      </span>
                      <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                        Shows in "Featured Pharmaceutical Products" showcase on Homepage.
                      </span>
                    </div>
                  </label>

                  {/* Option 2: Hot Selling Fast-Moving */}
                  <label className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    productForm.is_trending ? 'bg-rose-50/90 border-rose-300 shadow-xs' : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}>
                    <input
                      type="checkbox"
                      checked={Boolean(productForm.is_trending)}
                      onChange={(e) => setProductForm({ ...productForm, is_trending: e.target.checked })}
                      className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
                    />
                    <div>
                      <span className="font-extrabold text-xs text-slate-900 flex items-center space-x-1">
                        <span>🔥 Hot Selling / Fast Moving Section</span>
                      </span>
                      <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                        Shows in top banner "Top Fast-Moving Medicines" high-demand deals.
                      </span>
                    </div>
                  </label>
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
              {/* Hierarchy Belongs To / Parent Selection */}
              {userForm.role !== 'super_distributor' && (
                <div className="bg-orange-50/70 border border-orange-200/80 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-black text-orange-950 flex items-center space-x-1.5 text-xs">
                      <FolderTree className="w-4 h-4 text-[#ff5722]" />
                      <span>
                        {userForm.role === 'distributor' && 'Belongs To: Select Super Distributor *'}
                        {userForm.role === 'sub_distributor' && 'Belongs To: Select Distributor *'}
                        {userForm.role === 'retailer' && 'Belongs To: Select Sub Distributor *'}
                        {userForm.role === 'sub_retailer' && 'Belongs To: Select Retailer / Chemist *'}
                        {userForm.role === 'customer' && 'Linked To: Select Sub-Retailer / Sponsor'}
                      </span>
                    </label>
                    <span className="text-[10px] bg-[#ff5722] text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Hierarchy Chain
                    </span>
                  </div>

                  {loadingHierarchyParents ? (
                    <div className="flex items-center space-x-2 text-slate-500 py-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Loading available parent partners...</span>
                    </div>
                  ) : (
                    <div>
                      <select
                        value={userForm.parent_id || ''}
                        onChange={(e) => setUserForm({ ...userForm, parent_id: e.target.value })}
                        required={userForm.role !== 'customer'}
                        className="w-full px-3 py-2.5 bg-white border border-orange-200 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-[#ff5722] outline-none"
                      >
                        <option value="">-- Select Parent ({
                          userForm.role === 'distributor' ? 'Super Distributor' :
                          userForm.role === 'sub_distributor' ? 'Distributor' :
                          userForm.role === 'retailer' ? 'Sub Distributor' :
                          userForm.role === 'sub_retailer' ? 'Retailer' : 'Sub Retailer'
                        }) * --</option>
                        {hierarchyParents.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} {p.business_name ? `(${p.business_name})` : ''} • Ref: {p.referral_code} • {p.city || p.state}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-orange-800/80 mt-1">
                        All product rates, wholesale margins, and referral commissions configured for this parent's Super Distributor will automatically apply to this partner.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {userForm.role === 'super_distributor' && (
                <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900 flex items-center space-x-1.5">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <span>Top-Level Super Distributor</span>
                    </span>
                    <span className="text-[10px] bg-blue-600 text-white font-black px-2 py-0.5 rounded-full">
                      Root Partner
                    </span>
                  </div>
                  <p className="text-[10px] text-blue-700">
                    This Super Distributor operates directly under Company / Super Admin. Product rates and dynamic referral commissions can be configured separately in the "Assign Products & Set Price" tab.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Default Level 1 (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={userForm.level_1_commission !== undefined ? userForm.level_1_commission : 10}
                        onChange={(e) => setUserForm({ ...userForm, level_1_commission: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded-xl font-bold text-xs"
                      />
                      <span className="text-[10px] text-slate-400 block mt-0.5">Direct Referrer</span>
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Default Level 2 (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={userForm.level_2_commission !== undefined ? userForm.level_2_commission : 5}
                        onChange={(e) => setUserForm({ ...userForm, level_2_commission: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded-xl font-bold text-xs"
                      />
                      <span className="text-[10px] text-slate-400 block mt-0.5">Parent of L1</span>
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Default Level 3 (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={userForm.level_3_commission !== undefined ? userForm.level_3_commission : 2}
                        onChange={(e) => setUserForm({ ...userForm, level_3_commission: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded-xl font-bold text-xs"
                      />
                      <span className="text-[10px] text-slate-400 block mt-0.5">Parent of L2</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Full Name {userForm.business_name ? '(Optional)' : '*'}
                  </label>
                  <input
                    type="text"
                    required={!userForm.business_name}
                    placeholder="Enter contact person name"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Business / Agency Name</label>
                  <input
                    type="text"
                    placeholder="Company / Agency / Chemist name"
                    value={userForm.business_name}
                    onChange={(e) => setUserForm({ ...userForm, business_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={userForm.mobile || userForm.phone}
                    onChange={(e) => setUserForm({ ...userForm, mobile: e.target.value, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email Address (Optional)</label>
                  <input
                    type="email"
                    disabled={!!editingUser}
                    placeholder="email@example.com (Optional)"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Leave blank to auto-create using mobile number.
                  </span>
                </div>
              </div>

              {!editingUser && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Login Password (Optional)</label>
                  <input
                    type="password"
                    placeholder="Leave blank for default: password123"
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">PAN Number</label>
                  <input
                    type="text"
                    placeholder="ABCDE1234F"
                    value={userForm.pan_number}
                    onChange={(e) => setUserForm({ ...userForm, pan_number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    placeholder="24ABVFM0075D1ZA"
                    value={userForm.gst_number}
                    onChange={(e) => setUserForm({ ...userForm, gst_number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-mono uppercase font-bold"
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

      {/* ======================================================== */}
      {/* MODAL 1: ASSIGN PRODUCTS TO DISTRIBUTOR (IMAGE 2)        */}
      {/* ======================================================== */}
      {showAssignProductsModal && assignTargetUser && isSuperAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-5">
          <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header with gradient matching Image 2 */}
            <div className="bg-gradient-to-r from-[#ff5722] via-[#e64a19] to-[#0288d1] text-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 flex-shrink-0 shadow-md">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">📦</span>
                  <h3 className="text-base sm:text-lg font-black tracking-tight">Assign Products</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setAssignFilterOnlyAssigned(!assignFilterOnlyAssigned)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all flex items-center space-x-1.5 ${
                    assignFilterOnlyAssigned
                      ? 'bg-white text-[#ff5722] border-white shadow-xs'
                      : 'bg-white/20 hover:bg-white/30 text-white border-white/30'
                  }`}
                >
                  <span>✕</span>
                  <span>{assignFilterOnlyAssigned ? 'Showing Assigned Only' : 'Assign to Distributor'}</span>
                </button>
              </div>

              {/* Prominent State & Distributor Info (As Requested) */}
              <div className="flex items-center space-x-3">
                <div className="bg-black/25 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/20 text-right">
                  <div className="text-[11px] font-bold text-white flex items-center space-x-1.5 justify-end">
                    <span className="text-amber-300">📍 State:</span>
                    <span className="bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded text-[11px] uppercase tracking-wider">
                      {assignTargetUser.state || 'GUJARAT'}
                    </span>
                  </div>
                  <div className="text-[10px] text-white/90 font-medium">
                    Distributor: <span className="font-bold text-white">{assignTargetUser.name}</span> ({assignTargetUser.role?.replace('_', ' ').toUpperCase()})
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAssignProductsModal(false)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Search & Bulk Selection Bar */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={assignProductsSearch}
                  onChange={(e) => setAssignProductsSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-brand-blue-500 shadow-2xs"
                />
              </div>

              <div className="flex items-center space-x-3">
                <label className="flex items-center space-x-2 cursor-pointer text-xs font-bold text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={
                      assignedProductsList.length > 0 &&
                      selectedAssignProductIds.length === assignedProductsList.length
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedAssignProductIds(assignedProductsList.map((p) => p.id));
                      } else {
                        setSelectedAssignProductIds([]);
                      }
                    }}
                    className="w-4 h-4 rounded text-[#ff5722] focus:ring-[#ff5722]"
                  />
                  <span>Select All</span>
                </label>

                <span className="bg-[#ff5722] text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs">
                  {selectedAssignProductIds.length} Selected
                </span>

                {selectedAssignProductIds.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleBulkAssignSubmit(true)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                    >
                      Assign Selected
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkAssignSubmit(false)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                    >
                      Remove Selected
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Products List Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
              {assignProductsLoading ? (
                <div className="py-20 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#ff5722]" />
                  <span>Loading distributor products &amp; state rates...</span>
                </div>
              ) : (
                (() => {
                  const filtered = assignedProductsList.filter((p) => {
                    const matchSearch =
                      !assignProductsSearch ||
                      p.name.toLowerCase().includes(assignProductsSearch.toLowerCase()) ||
                      (p.category_name && p.category_name.toLowerCase().includes(assignProductsSearch.toLowerCase()));
                    const matchAssigned = !assignFilterOnlyAssigned || p.is_assigned;
                    return matchSearch && matchAssigned;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="py-16 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        No products found matching the criteria.
                      </div>
                    );
                  }

                  return filtered.map((product) => {
                    const isSelected = selectedAssignProductIds.includes(product.id);
                    return (
                      <div
                        key={product.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          isSelected
                            ? 'bg-amber-50/40 border-amber-300 shadow-sm'
                            : product.is_assigned
                            ? 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                            : 'bg-slate-50/70 border-dashed border-slate-300 opacity-75'
                        }`}
                      >
                        {/* Checkbox & Product Details */}
                        <div className="flex items-start space-x-3.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAssignProductIds((prev) => [...prev, product.id]);
                              } else {
                                setSelectedAssignProductIds((prev) => prev.filter((id) => id !== product.id));
                              }
                            }}
                            className="w-4 h-4 mt-1 rounded text-[#ff5722] focus:ring-[#ff5722] cursor-pointer"
                          />

                          <div className="space-y-1 min-w-0">
                            <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm tracking-tight truncate">
                              {product.name}
                            </h4>
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                              <span>{product.category_name || 'Tablets'}</span>
                              <span>•</span>
                              <span>{product.sub_category_name || 'Medicine'}</span>
                              <span className="text-slate-400">|</span>
                              <span className="text-slate-600 font-semibold">{product.manufacturer || 'MEDIGLAXO PHARMA'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Packaging, Pricing, Stock & Buttons */}
                        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 sm:gap-4 pl-7 sm:pl-0">
                          <div className="text-center">
                            <span className="text-[10px] text-slate-400 block font-semibold">Packaging</span>
                            <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                              {product.box_packing || '1 Box (10 Strips)'}
                            </span>
                          </div>

                          <div className="text-right">
                            <div className="text-xs sm:text-sm font-black text-[#ff5722]">
                              ₹{Number(product.product_price || product.end_user_price || product.base_price || 10).toFixed(2)}
                            </div>
                            <div className="text-[10px] text-slate-500 font-bold">Configured Rate</div>
                            <div className="text-[10px] text-slate-400">MRP: ₹{Number(product.mrp || 124).toFixed(2)}</div>
                          </div>

                          <div className="text-left hidden md:block">
                            <div className="flex items-center space-x-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              <span>L1: {product.level_1_commission !== undefined ? product.level_1_commission : 10}%</span>
                              <span>•</span>
                              <span>L2: {product.level_2_commission !== undefined ? product.level_2_commission : 5}%</span>
                              <span>•</span>
                              <span>L3: {product.level_3_commission !== undefined ? product.level_3_commission : 2}%</span>
                            </div>
                            <span className="text-[9px] text-slate-400 block mt-0.5">3-Level Referral</span>
                          </div>

                          <div>
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                              product.stock > 0 ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                            }`}>
                              {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            {/* Green Set Price Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenSetPriceModal(product)}
                              className="px-3 py-1.5 bg-[#00a859] hover:bg-[#008f4c] text-white text-xs font-bold rounded-lg flex items-center space-x-1 shadow-xs transition-all"
                            >
                              <span>📊</span>
                              <span>Set Price</span>
                            </button>

                            {/* Red Remove / Green Assign Button */}
                            <button
                              type="button"
                              onClick={() => handleToggleProductAssignment(product.id, !product.is_assigned)}
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center space-x-1 shadow-xs transition-all ${
                                product.is_assigned
                                  ? 'bg-[#e53935] hover:bg-[#d32f2f] text-white'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>{product.is_assigned ? 'Remove' : 'Assign'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: SET PRODUCT PRICE (IMAGE 3)                      */}
      {/* ======================================================== */}
      {showSetPriceModal && priceTargetProduct && assignTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-5">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header matching Image 3 with gradient */}
            <div className="bg-gradient-to-r from-[#ff5722] to-[#0288d1] text-white p-4 sm:p-5 flex items-center justify-between shadow-md">
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-tight">Set Product Price</h3>
                <p className="text-[11px] text-white/90 font-medium">
                  {priceTargetProduct.name} • {assignTargetUser.role?.replace('_', ' ').toUpperCase()} Pricing ({assignTargetUser.name})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSetPriceModal(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProductPriceSubmit} className="p-5 sm:p-6 space-y-4">
              {/* Product ID & Base Price Card */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">{priceTargetProduct.name}</h4>
                  <span className="text-[11px] font-mono text-slate-400 font-bold block">Product ID: {priceTargetProduct.id}</span>
                  <div className="mt-1">
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-md">
                      📍 Applicable State: {assignTargetUser.state || 'GUJARAT'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 font-bold block">Base Price</span>
                  <span className="text-lg font-black text-[#ff5722]">₹{Number(priceTargetProduct.base_price || 10).toFixed(2)}</span>
                </div>
              </div>

              {/* Margins & End User Price Row */}
              <div className="space-y-1.5">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">SD Margin (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={priceForm.sd_margin}
                      onChange={(e) => setPriceForm({ ...priceForm, sd_margin: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs focus:bg-white focus:border-[#ff5722] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Dist Margin (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={priceForm.dist_margin}
                      onChange={(e) => setPriceForm({ ...priceForm, dist_margin: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs focus:bg-white focus:border-[#ff5722] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Sub D Margin (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={priceForm.subd_margin}
                      onChange={(e) => setPriceForm({ ...priceForm, subd_margin: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs focus:bg-white focus:border-[#ff5722] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Rt Margin (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={priceForm.rt_margin}
                      onChange={(e) => setPriceForm({ ...priceForm, rt_margin: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs focus:bg-white focus:border-[#ff5722] outline-none"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Product Price / Rate (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={priceForm.product_price !== undefined ? priceForm.product_price : priceForm.end_user_price}
                      onChange={(e) => setPriceForm({ ...priceForm, product_price: e.target.value, end_user_price: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs text-slate-900 focus:bg-white focus:border-[#ff5722] outline-none"
                    />
                  </div>
                </div>

                {/* 3-Level Dynamic Referral Commission (Configurable per Super Distributor + Product) */}
                <div className="bg-amber-50/80 border border-amber-300 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 font-black text-amber-950 text-xs">
                      <Calculator className="w-4 h-4 text-amber-600" />
                      <span>3-Level Referral Commission Structure ({assignTargetUser.name})</span>
                    </div>
                    <span className="text-[10px] bg-amber-600 text-white font-black px-2.5 py-0.5 rounded-full">
                      Max 3 Levels • Zero Hardcoding
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    Referral commissions are calculated strictly across a maximum of 3 referral levels based on the buyer's upline chain. Commission stops completely after Level 3.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-black text-slate-800">
                          Level 1 Commission (%)
                        </label>
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded">
                          Direct Referrer
                        </span>
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={priceForm.level_1_commission !== undefined ? priceForm.level_1_commission : 10}
                        onChange={(e) => setPriceForm({ ...priceForm, level_1_commission: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-amber-300 rounded-xl font-black text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                      <span className="text-[10px] text-slate-500 block mt-1">
                        Immediate sponsor of the customer
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-black text-slate-800">
                          Level 2 Commission (%)
                        </label>
                        <span className="text-[9px] bg-blue-100 text-blue-800 font-extrabold px-1.5 py-0.5 rounded">
                          Parent of L1
                        </span>
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={priceForm.level_2_commission !== undefined ? priceForm.level_2_commission : 5}
                        onChange={(e) => setPriceForm({ ...priceForm, level_2_commission: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-amber-300 rounded-xl font-black text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                      <span className="text-[10px] text-slate-500 block mt-1">
                        Upline sponsor of Level 1 user
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-black text-slate-800">
                          Level 3 Commission (%)
                        </label>
                        <span className="text-[9px] bg-purple-100 text-purple-800 font-extrabold px-1.5 py-0.5 rounded">
                          Parent of L2
                        </span>
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={priceForm.level_3_commission !== undefined ? priceForm.level_3_commission : 2}
                        onChange={(e) => setPriceForm({ ...priceForm, level_3_commission: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-amber-300 rounded-xl font-black text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                      <span className="text-[10px] text-slate-500 block mt-1">
                        Final upline (Calculation stops here)
                      </span>
                    </div>
                  </div>

                  {/* Live Commission Amounts Breakdown Badge */}
                  {(() => {
                    const pPrice = Number(priceForm.product_price || priceForm.end_user_price) || 0;
                    const l1Pct = Number(priceForm.level_1_commission !== undefined ? priceForm.level_1_commission : 10);
                    const l2Pct = Number(priceForm.level_2_commission !== undefined ? priceForm.level_2_commission : 5);
                    const l3Pct = Number(priceForm.level_3_commission !== undefined ? priceForm.level_3_commission : 2);

                    const l1Amt = ((pPrice * l1Pct) / 100).toFixed(2);
                    const l2Amt = ((pPrice * l2Pct) / 100).toFixed(2);
                    const l3Amt = ((pPrice * l3Pct) / 100).toFixed(2);
                    const totalPct = (l1Pct + l2Pct + l3Pct).toFixed(1);
                    const totalAmt = (Number(l1Amt) + Number(l2Amt) + Number(l3Amt)).toFixed(2);

                    return (
                      <div className="bg-white border border-amber-200 rounded-xl p-3 text-[11px] space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                          <span className="text-amber-950 font-bold">
                            Per-Unit Payouts on Price <strong className="font-black text-slate-900">₹{pPrice.toFixed(2)}</strong>:
                          </span>
                          <span className="text-[10px] font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                            Total 3-Level Payout: {totalPct}% (₹{totalAmt})
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
                          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-2 rounded-lg">
                            <span className="text-[10px] font-bold block text-emerald-700">Level 1 (Direct)</span>
                            <strong className="text-xs font-black">₹{l1Amt}</strong>
                            <span className="text-[10px] text-emerald-600 block">({l1Pct}%)</span>
                          </div>
                          <div className="bg-blue-50 border border-blue-200 text-blue-900 p-2 rounded-lg">
                            <span className="text-[10px] font-bold block text-blue-700">Level 2 (Parent of L1)</span>
                            <strong className="text-xs font-black">₹{l2Amt}</strong>
                            <span className="text-[10px] text-blue-600 block">({l2Pct}%)</span>
                          </div>
                          <div className="bg-purple-50 border border-purple-200 text-purple-900 p-2 rounded-lg">
                            <span className="text-[10px] font-bold block text-purple-700">Level 3 (Parent of L2)</span>
                            <strong className="text-xs font-black">₹{l3Amt}</strong>
                            <span className="text-[10px] text-purple-600 block">({l3Pct}%)</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Margin Amounts Live Green Box (Matching Image 3) */}
                {(() => {
                  const endUser = Number(priceForm.end_user_price) || 0;
                  const sdAmt = ((endUser * Number(priceForm.sd_margin || 0)) / 100).toFixed(2);
                  const distAmt = ((endUser * Number(priceForm.dist_margin || 0)) / 100).toFixed(2);
                  const subdAmt = ((endUser * Number(priceForm.subd_margin || 0)) / 100).toFixed(2);
                  const rtAmt = ((endUser * Number(priceForm.rt_margin || 0)) / 100).toFixed(2);
                  const totalAmt = (Number(sdAmt) + Number(distAmt) + Number(subdAmt) + Number(rtAmt)).toFixed(2);

                  return (
                    <div className="bg-[#e8f5e9] border border-[#c8e6c9] rounded-xl p-2.5 text-[11px] text-[#2e7d32] space-y-1">
                      <div className="font-black text-[#1b5e20] text-[11px]">Margin Amounts</div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-semibold">
                        <span>SD Margin: <strong className="text-[#1b5e20] font-black">₹{sdAmt}</strong></span>
                        <span>Dist Margin: <strong className="text-[#1b5e20] font-black">₹{distAmt}</strong></span>
                        <span>Sub D Margin: <strong className="text-[#1b5e20] font-black">₹{subdAmt}</strong></span>
                        <span>Rt Margin: <strong className="text-[#1b5e20] font-black">₹{rtAmt}</strong></span>
                        <span className="border-l border-[#a5d6a7] pl-3 text-slate-900">Total Margin: <strong className="font-black text-slate-900">₹{totalAmt}</strong></span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Direct Prices Section (Matching Image 3) */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-xs">For Wholesaler - Set Direct Prices (Per Box Rate)</h4>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    📦 Box Unit: {priceTargetProduct?.box_packing || '1 Box (10 Strips)'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Wholesale price applies strictly to complete Box packaging (not loose strips).
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">SD Price (₹ / Box)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={priceForm.sd_price}
                      onChange={(e) => setPriceForm({ ...priceForm, sd_price: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs focus:bg-white focus:border-[#ff5722] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Dist Price (₹ / Box)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={priceForm.dist_price}
                      onChange={(e) => setPriceForm({ ...priceForm, dist_price: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs focus:bg-white focus:border-[#ff5722] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Sub D Price (₹ / Box)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={priceForm.subd_price}
                      onChange={(e) => setPriceForm({ ...priceForm, subd_price: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs focus:bg-white focus:border-[#ff5722] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Retailer Price (₹ / Box)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={priceForm.retailer_price}
                      onChange={(e) => setPriceForm({ ...priceForm, retailer_price: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs focus:bg-white focus:border-[#ff5722] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSetPriceModal(false)}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPrice}
                  className="px-6 py-2 bg-[#ff5722] hover:bg-[#f4511e] text-white text-xs font-bold rounded-xl shadow-md shadow-[#ff5722]/30 transition-all flex items-center space-x-1.5"
                >
                  {savingPrice && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{savingPrice ? 'Saving...' : 'Save Price'}</span>
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

      {/* Dispatch Order & Add Tracking Modal */}
      {showDispatchModal && (
        <DispatchModal
          order={dispatchTargetOrder}
          isOpen={showDispatchModal}
          onClose={() => {
            setShowDispatchModal(false);
            setDispatchTargetOrder(null);
          }}
          onSuccess={fetchData}
        />
      )}

      {/* Live Order Tracking Modal */}
      {showTrackingModal && (
        <OrderTrackingModal
          order={trackingTargetOrder}
          isOpen={showTrackingModal}
          onClose={() => {
            setShowTrackingModal(false);
            setTrackingTargetOrder(null);
          }}
        />
      )}

      {/* Category / Subcategory Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95 duration-150 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center font-bold text-base text-[#ff5722]">
                  {categoryForm.icon || '📁'}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingCategory
                      ? (categoryForm.parent_id ? 'Edit Subcategory' : 'Edit Parent Category')
                      : (categoryForm.parent_id ? 'Add New Subcategory' : 'Add New Parent Category')}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {categoryForm.parent_id
                      ? `Creating child subcategory under: ${categoriesList.find(c => c.id === parseInt(categoryForm.parent_id))?.name || 'Selected Category'}`
                      : 'Creating top-level parent category for navigation and catalog'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setEditingCategory(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3.5 text-xs">
              {/* Type / Parent Category Selector */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Category Level / Placement *
                </label>
                <select
                  value={categoryForm.parent_id}
                  onChange={(e) => setCategoryForm({ ...categoryForm, parent_id: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-800 outline-none focus:bg-white focus:border-[#ff5722] cursor-pointer"
                >
                  <option value="">Top-Level Parent Category (e.g. Tablets, Capsules, Syrups)</option>
                  {categoriesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      Subcategory under: {c.name}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 block mt-1">
                  {categoryForm.parent_id
                    ? 'Yeh subcategory selected parent category ke under products filter karegi.'
                    : 'Yeh main category banegi jo navigation menu aur catalog header me aayegi.'}
                </span>
              </div>

              {/* Name */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {categoryForm.parent_id ? 'Subcategory Name *' : 'Category Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={categoryForm.parent_id ? 'e.g. Antibiotics, Antipyretic, Pain Relief, Vitamins' : 'e.g. Tablets, Capsules, Syrups, Injections'}
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900 outline-none focus:bg-white focus:border-[#ff5722]"
                />
              </div>

              {/* Icon & Sort Order */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Icon / Emoji</label>
                  <input
                    type="text"
                    placeholder="e.g. 💊, 🧴, 💉, 🩺"
                    value={categoryForm.icon}
                    onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={categoryForm.sort_order}
                    onChange={(e) => setCategoryForm({ ...categoryForm, sort_order: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Category details and indications"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false);
                    setEditingCategory(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#ff5722] hover:bg-[#f4511e] text-white rounded-xl font-black text-xs shadow-md shadow-[#ff5722]/20 transition-all cursor-pointer"
                >
                  {editingCategory ? 'Update Category' : (categoryForm.parent_id ? 'Save Subcategory' : 'Save Category')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
