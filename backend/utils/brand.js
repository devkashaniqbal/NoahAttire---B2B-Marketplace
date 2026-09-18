const SellerProfile = require('../models/SellerProfile');

// Title-cases a raw string like "noahattire" -> "Noahattire" as a display fallback.
function titleCase(str) {
  if (!str) return str;
  return str.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

// Attaches a `brandName` (and `brandLogo` if available) to one or more hydrated
// products, preferring the seller's storefront businessName over their personal
// account name so listings show "Noah Attire" instead of "Platform Admin".
async function attachBrandNames(products) {
  const isArray = Array.isArray(products);
  const list = (isArray ? products : [products]).filter(Boolean);
  if (!list.length) return products;

  const sellerIds = [...new Set(
    list.map((p) => (typeof p.sellerId === 'object' ? p.sellerId?._id : p.sellerId)).filter(Boolean)
  )];
  if (!sellerIds.length) return products;

  const profiles = await SellerProfile.find({ userId: { $in: sellerIds } }).select('userId businessName logo');
  const profileMap = {};
  profiles.forEach((p) => { profileMap[p.userId] = p; });

  list.forEach((p) => {
    const uid = typeof p.sellerId === 'object' ? p.sellerId?._id : p.sellerId;
    const profile = profileMap[uid];
    const personName = typeof p.sellerId === 'object' ? p.sellerId?.name : null;
    p.brandName = (p.brand && titleCase(p.brand))
      || (profile?.businessName && titleCase(profile.businessName))
      || personName
      || 'Verified Seller';
    if (profile?.logo) p.brandLogo = profile.logo;
  });

  return products;
}

module.exports = { attachBrandNames, titleCase };
