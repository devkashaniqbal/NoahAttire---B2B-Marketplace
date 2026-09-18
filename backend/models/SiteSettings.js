const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema(
  {
    logoUrl: { type: String, default: '' },
    heroImage: { type: String, default: '' },
    heroBanners: { type: [String], default: [] },
    heroHeadline: { type: String, default: 'SOURCE THE LATEST PRODUCTS ONLINE' },
    heroSubtext: { type: String, default: '' },
    heroButtonText: { type: String, default: 'SHOP NOW' },
    heroButtonLink: { type: String, default: '/products' },
  },
  { timestamps: true }
);

// Singleton document — always read/write the one settings row.
siteSettingsSchema.statics.getSingleton = async function () {
  let settings = await this.findOne();
  if (!settings) settings = await this.create({});
  return settings;
};

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
