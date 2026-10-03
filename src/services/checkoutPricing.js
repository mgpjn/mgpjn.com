export const quoteErrorMessage = (err) => Object.values(err.response?.data?.errors || {}).flat()[0]
  || err.response?.data?.message || err.message || 'Unable to verify your order amount. Please try again.';

export const verifyQuote = (data) => {
  const summary = data?.payment_summary;
  const fields = ['subtotal', 'delivery_charge', 'platform_fee', 'cod_charge', 'coupon_discount', 'delivery_discount', 'total_amount', 'wallet_used', 'payable_now'];
  if (!data?.success || !summary || fields.some((key) => summary[key] == null || !Number.isFinite(Number(summary[key])) || Number(summary[key]) < 0)) {
    throw new Error('Unable to verify your order amount. Please try again.');
  }
  const amounts = Object.fromEntries(fields.map((key) => [key, Number(summary[key])]));
  if (Math.abs(amounts.total_amount - (amounts.subtotal + amounts.delivery_charge + amounts.platform_fee + amounts.cod_charge - amounts.coupon_discount)) > 0.02
    || Math.abs(amounts.total_amount - amounts.wallet_used - amounts.payable_now) > 0.02) {
    throw new Error('Order amount changed. Please refresh and try again.');
  }
  return { ...data, payment_summary: { ...summary, ...amounts } };
};

export const buildQuotePayload = ({ items, state, pincode, paymentMethod, useWallet, walletBalance, couponCode }) => ({
  state, pincode: pincode || null,
  payment_method: useWallet && walletBalance > 0 ? 'wallet_split' : paymentMethod,
  other_payment_method: useWallet && walletBalance > 0 ? paymentMethod : null,
  wallet_amount_used: useWallet ? Math.max(0, Number(walletBalance) || 0) : 0,
  delivery_type: paymentMethod === 'takeaway' ? 'takeaway' : 'home_delivery',
  coupon_code: couponCode || null,
  items: items.map((item) => ({ product_id: item.id, quantity: item.quantity })),
});
