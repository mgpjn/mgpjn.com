const ROLE_PRICE_FIELDS = {
  super_distributor: 'sd_price',
  distributor: 'dist_price',
  sub_distributor: 'subd_price',
  retailer: 'retailer_price',
  sub_retailer: 'retailer_price',
  member: 'retailer_price',
};

const ADMIN_ROLES = new Set(['admin', 'super_admin']);

const positiveNumber = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

export const getRetailPrice = (product = {}) => (
  positiveNumber(product.retail_price) || positiveNumber(product.price)
);

export const getPackSubtitle = (product = {}) => {
  if (product.strip_packing?.trim()) return product.strip_packing;
  if (product.packaging_size?.trim()) return product.packaging_size;
  if (product.pack_size?.trim()) return product.pack_size;
  if (product.subtitle?.trim()) return product.subtitle;
  if (product.strip_unit?.trim()) return `1 ${product.strip_unit}`;

  const form = (product.dosage_form || '').toLowerCase();
  if (form.includes('tablet')) return 'strip of 10 tablets';
  if (form.includes('capsule')) return 'strip of 10 capsules';
  if (form.includes('syrup')) return 'bottle of 100 ml Syrup';
  if (form.includes('injection')) return 'vial of 1 injection';
  if (form.includes('ointment') || form.includes('cream')) return 'tube of 30 gm Cream';
  if (form.includes('powder')) return 'jar of 400 gm Powder';
  if (form.includes('drop')) return 'bottle of 10 ml Drops';
  return product.unit ? `1 ${product.unit}` : '1 Unit';
};

export const getWholesalePriceForUser = (product = {}, user = null) => {
  if (!user) return 0;

  const role = String(user.role || '').toLowerCase().trim();
  const roleField = ROLE_PRICE_FIELDS[role];
  const rolePrice = roleField ? positiveNumber(product[roleField]) : 0;
  if (rolePrice) return rolePrice;

  const assignedWholesalePrice = positiveNumber(product.wholesale_price);
  if (product.is_assigned === true && assignedWholesalePrice) return assignedWholesalePrice;

  if (ADMIN_ROLES.has(role) && assignedWholesalePrice) return assignedWholesalePrice;

  return 0;
};

export const getProductPricing = (product = {}, user = null) => {
  const retailPrice = getRetailPrice(product);
  const retailMrp = positiveNumber(product.mrp) || (retailPrice ? retailPrice * 1.35 : 0);
  const wholesalePrice = getWholesalePriceForUser(product, user);
  const wholesaleAllowed = wholesalePrice > 0;
  const wholesaleMrp = wholesaleAllowed
    ? (positiveNumber(product.wholesale_mrp) || (positiveNumber(product.mrp) ? positiveNumber(product.mrp) * 10 : wholesalePrice * 1.5))
    : 0;

  return {
    retailPrice,
    retailMrp,
    retailDiscount: retailMrp > retailPrice ? Math.round(((retailMrp - retailPrice) / retailMrp) * 100) : 0,
    wholesaleAllowed,
    wholesalePrice,
    wholesaleMrp,
    wholesaleDiscount: wholesaleAllowed && wholesaleMrp > wholesalePrice
      ? Math.round(((wholesaleMrp - wholesalePrice) / wholesaleMrp) * 100)
      : 0,
    wholesaleSavings: wholesaleAllowed ? Math.max(0, wholesaleMrp - wholesalePrice) : 0,
  };
};
