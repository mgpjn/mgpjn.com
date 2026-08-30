/**
 * Computes human-friendly delivery / takeaway timing based on order creation time and payment/order mode.
 */
export function getOrderDeliveryTiming(orderOrPaymentMethod) {
  const isTakeaway = typeof orderOrPaymentMethod === "string"
    ? orderOrPaymentMethod === "takeaway"
    : (
        orderOrPaymentMethod?.payment_method === "takeaway" ||
        orderOrPaymentMethod?.delivery_type === "takeaway" ||
        (orderOrPaymentMethod?.notes && orderOrPaymentMethod.notes.includes("TAKEAWAY"))
      );

  if (isTakeaway) {
    return {
      isTakeaway: true,
      badgeText: "Store Takeaway / Self Pickup",
      timingTitle: "Ready for Pickup within 30–60 Minutes",
      pickupWindow: "Today between 10:00 AM – 9:30 PM",
      instruction: "Visit your nearest authorized MediGlaxo pharmacy hub with this Order ID to collect your package.",
      tag: "Express 45-Min Pickup"
    };
  }

  // Home Delivery: Calculate expected delivery today or tomorrow
  const now = new Date();
  const currentHour = now.getHours();

  let timingTitle = "Get by 8:00 PM, Today";
  let subText = "Guaranteed Same-Day Delivery";
  let dateText = "Today";

  if (currentHour >= 18) {
    // After 6 PM, delivery is next morning
    timingTitle = "Get by 12:00 PM, Tomorrow";
    subText = "Next Morning Express Delivery";
    dateText = "Tomorrow Morning";
  } else if (currentHour >= 13) {
    // Between 1 PM and 6 PM
    timingTitle = "Get by 8:00 PM, Today";
    subText = "Evening Express Delivery";
    dateText = "Today Evening";
  } else {
    // Before 1 PM
    timingTitle = "Get by 5:00 PM, Today";
    subText = "Afternoon Express Delivery";
    dateText = "Today Afternoon";
  }

  return {
    isTakeaway: false,
    badgeText: "Home Delivery",
    timingTitle,
    subText,
    dateText,
    instruction: "Our delivery partner will safely deliver your sealed medicine package at your doorstep.",
    tag: "Same-Day Express"
  };
}
