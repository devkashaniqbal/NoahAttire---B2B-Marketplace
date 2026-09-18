const SiteSettings = require('../models/SiteSettings');

exports.getSettings = async (req, res, next) => {
  try {
    const settings = await SiteSettings.getSingleton();
    res.json({ settings });
  } catch (err) {
    next(err);
  }
};

const EDITABLE_FIELDS = [
  'logoUrl', 'heroImage', 'heroBanners', 'heroHeadline', 'heroSubtext', 'heroButtonText', 'heroButtonLink',
];

exports.updateSettings = async (req, res, next) => {
  try {
    const settings = await SiteSettings.getSingleton();
    for (const field of EDITABLE_FIELDS) {
      if (req.body[field] !== undefined) settings[field] = req.body[field];
    }
    await settings.save();
    res.json({ settings, message: 'Site settings updated' });
  } catch (err) {
    next(err);
  }
};
