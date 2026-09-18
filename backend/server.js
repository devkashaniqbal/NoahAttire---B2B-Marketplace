require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const sellerRoutes = require('./routes/sellers');
const productRoutes = require('./routes/products');
const inquiryRoutes = require('./routes/inquiries');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/upload');
const orderRoutes = require('./routes/orders');
const rfqRoutes = require('./routes/rfqs');
const paymentRoutes = require('./routes/payments');
const supplierRoutes = require('./routes/suppliers');
const procurementRoutes = require('./routes/procurement');
const savedSellerRoutes = require('./routes/savedSellers');
const supportRoutes = require('./routes/support');
const returnRoutes = require('./routes/returns');
const messageRoutes = require('./routes/messages');
const siteSettingsRoutes = require('./routes/siteSettings');
const blogRoutes = require('./routes/blog');
const categoryRoutes = require('./routes/categories');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.set('trust proxy', 1);

// CORS — allow frontend origin with credentials
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/rfqs', rfqRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/procurement', procurementRoutes);
app.use('/api/saved-sellers', savedSellerRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/site-settings', siteSettingsRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/categories', categoryRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Dev-only seed endpoints — idempotent, safe to call multiple times
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/dev/seed', async (req, res) => {
    try {
      const SellerProfile = require('./models/SellerProfile');
      const Product = require('./models/Product');
      const Order = require('./models/Order');
      const { getOrCreateFirebaseUser } = require('./config/firebaseAdmin');
      const userStore = require('./utils/userStore');

      async function seedAccount({ name, email, password, role }) {
        const fbUser = await getOrCreateFirebaseUser({ email, password, name });
        let profile = await userStore.getUserProfile(fbUser.uid);
        if (!profile) profile = await userStore.createUserProfile(fbUser.uid, { name, email, role });
        return { _id: fbUser.uid, ...profile };
      }

      // Admin
      const admin = await seedAccount({ name: 'Platform Admin', email: 'admin@tradehub.b2b', password: 'admin123', role: 'admin' });

      // Sellers
      const seller = await seedAccount({ name: 'Ahmed Khan', email: 'seller@example.com', password: 'seller123', role: 'seller' });
      if (!(await SellerProfile.findOne({ userId: seller._id }))) {
        await SellerProfile.create({ userId: seller._id, businessName: 'AK Traders', approvalStatus: 'approved', isActive: true });
      }
      const seller2 = await seedAccount({ name: 'Fatima Noor', email: 'seller2@example.com', password: 'seller123', role: 'seller' });
      if (!(await SellerProfile.findOne({ userId: seller2._id }))) {
        await SellerProfile.create({ userId: seller2._id, businessName: 'Noor Agro Exports', approvalStatus: 'approved', isActive: true });
      }
      const seller3 = await seedAccount({ name: 'Bilal Sheikh', email: 'seller3@example.com', password: 'seller123', role: 'seller' });
      if (!(await SellerProfile.findOne({ userId: seller3._id }))) {
        await SellerProfile.create({ userId: seller3._id, businessName: 'Sheikh Office & Lifestyle Co', approvalStatus: 'approved', isActive: true });
      }

      // Buyer
      const buyer = await seedAccount({ name: 'Sara Malik', email: 'buyer@example.com', password: 'buyer123', role: 'buyer' });

      const img = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`;

      // Products — re-seeded fresh each call so image/catalog updates always take effect
      await Product.deleteMany({ sellerId: { $in: [seller._id, seller2._id, seller3._id] } });
      const createdProducts = await Product.insertMany([
        { sellerId: seller._id, title: 'Industrial Water Pump 5HP', description: 'High-performance centrifugal pump for industrial use.', category: 'Workwear & Uniforms', priceRange: { min: 250, max: 800 }, unit: 'piece', minOrderQty: 1, location: 'Lahore, Pakistan', tags: ['pump', 'industrial', 'water'], stock: 45, costPrice: 150, lowStockThreshold: 10, images: [img('1581092160562-40aa08e78837'), img('1581244277943-fe4a9c777189')] },
        { sellerId: seller._id, title: 'Basmati Rice (25kg Bag)', description: 'Premium long-grain basmati rice, export quality.', category: 'Accessories', priceRange: { min: 30, max: 45 }, unit: 'bag', minOrderQty: 50, location: 'Karachi, Pakistan', tags: ['rice', 'basmati', 'food'], stock: 8, costPrice: 18, lowStockThreshold: 20, images: [img('1586201375761-83865001e31c'), img('1604719312566-8912e9227c6a')] },
        { sellerId: seller._id, title: 'Cotton Fabric Roll 60"', description: 'Pure cotton fabric, 200 GSM, available in all colours.', category: "Men's Apparel", priceRange: { min: 2, max: 5 }, unit: 'meter', minOrderQty: 500, location: 'Faisalabad, Pakistan', tags: ['cotton', 'fabric', 'textile'], stock: 1200, costPrice: 1, lowStockThreshold: 100, images: [img('1558769132-cb1aea458c5e'), img('1542060748-10c28b62716f')] },
        { sellerId: seller._id, title: 'Solar Panel 400W Monocrystalline', description: 'High-efficiency mono solar panel for commercial installations.', category: 'Promotional Merchandise', priceRange: { min: 120, max: 180 }, unit: 'piece', minOrderQty: 10, location: 'Islamabad, Pakistan', tags: ['solar', 'energy', 'panel'], stock: 5, costPrice: 80, lowStockThreshold: 15, images: [img('1509391366360-2e959784a276'), img('1518770660439-4636190af475')] },
        { sellerId: seller._id, title: 'Portland Cement (50kg)', description: 'OPC Grade 53 cement for construction projects.', category: 'Safety Wear', priceRange: { min: 8, max: 12 }, unit: 'bag', minOrderQty: 100, location: 'Rawalpindi, Pakistan', tags: ['cement', 'construction'], stock: 600, costPrice: 5, lowStockThreshold: 50, images: [img('1541888946425-d81bb19240f5'), img('1503387762-592deb58ef4e')] },
        { sellerId: seller._id, title: 'Urea Fertilizer (50kg)', description: 'Granular urea 46% nitrogen for agricultural use.', category: 'Tactical & Outdoor Wear', priceRange: { min: 20, max: 28 }, unit: 'bag', minOrderQty: 200, location: 'Multan, Pakistan', tags: ['fertilizer', 'urea', 'agriculture'], stock: 300, costPrice: 14, lowStockThreshold: 40, images: [img('1574943320219-553eb213f72d'), img('1500382017468-9049fed747ef')] },
        { sellerId: seller._id, title: 'Lab Grade Sulphuric Acid (35kg Drum)', description: 'High-purity sulphuric acid for industrial and laboratory applications.', category: 'Medical Apparel', priceRange: { min: 40, max: 65 }, unit: 'drum', minOrderQty: 10, location: 'Sialkot, Pakistan', tags: ['chemical', 'acid', 'industrial'], stock: 80, costPrice: 28, lowStockThreshold: 15, images: [img('1532187863486-abf9dbad1b69'), img('1581093588401-fbb62a02f120')] },
        { sellerId: seller._id, title: 'Wireless Bluetooth Earbuds (Bulk Pack)', description: 'Bulk-pack wireless earbuds with charging case, ready for retail distribution.', category: 'Promotional Merchandise', priceRange: { min: 9, max: 15 }, unit: 'piece', minOrderQty: 100, location: 'Karachi, Pakistan', tags: ['electronics', 'audio', 'wireless'], stock: 30, costPrice: 6, lowStockThreshold: 50, images: [img('1581092918056-0c4c3acd3789'), img('1531297484001-80022131f5a1')] },

        { sellerId: seller2._id, title: "Men's Cotton Hoodie (Wholesale Pack)", description: 'Premium cotton fleece hoodies, assorted sizes, wholesale packaging.', category: "Men's Apparel", priceRange: { min: 6, max: 11 }, unit: 'piece', minOrderQty: 200, location: 'Sialkot, Pakistan', tags: ['apparel', 'hoodie', 'cotton'], stock: 25, costPrice: 4, lowStockThreshold: 60, images: [img('1620799140408-edc6dcb6d633'), img('1556905055-8f358a7a47b2')] },
        { sellerId: seller2._id, title: 'Fresh Mixed Vegetables (Export Crate)', description: 'Farm-fresh seasonal vegetables, packed in export-grade crates.', category: 'Accessories', priceRange: { min: 15, max: 22 }, unit: 'crate', minOrderQty: 30, location: 'Multan, Pakistan', tags: ['vegetables', 'fresh', 'export'], stock: 400, costPrice: 9, lowStockThreshold: 50, images: [img('1610348725531-843dff563e2c'), img('1546548970-71785318a17b')] },
        { sellerId: seller2._id, title: 'CNC Lathe Machine Spare Parts Kit', description: 'Complete spare parts kit for industrial CNC lathe maintenance.', category: 'Workwear & Uniforms', priceRange: { min: 60, max: 95 }, unit: 'kit', minOrderQty: 5, location: 'Gujranwala, Pakistan', tags: ['cnc', 'machinery', 'spare parts'], stock: 18, costPrice: 38, lowStockThreshold: 10, images: [img('1567361808960-dec9cb578182'), img('1581244277943-fe4a9c777189')] },
        { sellerId: seller2._id, title: 'Steel Reinforcement Bars (Rebar)', description: 'Grade 60 deformed steel rebar for structural construction.', category: 'Safety Wear', priceRange: { min: 55, max: 70 }, unit: 'ton', minOrderQty: 5, location: 'Rawalpindi, Pakistan', tags: ['steel', 'rebar', 'construction'], stock: 90, costPrice: 42, lowStockThreshold: 20, images: [img('1541888946425-d81bb19240f5'), img('1503387762-592deb58ef4e')] },
        { sellerId: seller2._id, title: 'Organic Wheat Grain (Bulk Export)', description: 'Certified organic wheat grain, bulk export packaging.', category: 'Tactical & Outdoor Wear', priceRange: { min: 18, max: 24 }, unit: 'ton', minOrderQty: 10, location: 'Multan, Pakistan', tags: ['wheat', 'organic', 'grain'], stock: 220, costPrice: 13, lowStockThreshold: 30, images: [img('1500937386664-56d1dfef3854'), img('1574943320219-553eb213f72d')] },
        { sellerId: seller2._id, title: 'Industrial Safety Goggles (Bulk Pack)', description: 'ANSI-rated safety goggles for chemical and industrial handling.', category: 'Medical Apparel', priceRange: { min: 3, max: 6 }, unit: 'piece', minOrderQty: 100, location: 'Sialkot, Pakistan', tags: ['safety', 'goggles', 'ppe'], stock: 12, costPrice: 2, lowStockThreshold: 40, images: [img('1581093588401-fbb62a02f120'), img('1532187863486-abf9dbad1b69')] },

        { sellerId: seller._id, title: 'Heavy Duty Industrial Lathe Machine', description: 'Precision CNC lathe machine for metalworking and fabrication shops.', category: 'Workwear & Uniforms', priceRange: { min: 1200, max: 2500 }, unit: 'piece', minOrderQty: 1, location: 'Gujranwala, Pakistan', tags: ['lathe', 'cnc', 'machinery'], stock: 6, costPrice: 950, lowStockThreshold: 3, images: [img('1581092335397-9583eb92d232'), img('1581092160562-40aa08e78837')] },
        { sellerId: seller._id, title: 'Desktop Computer Workstation Bundle', description: 'Complete desktop workstation bundle for office and engineering use.', category: 'Promotional Merchandise', priceRange: { min: 380, max: 520 }, unit: 'piece', minOrderQty: 5, location: 'Karachi, Pakistan', tags: ['computer', 'desktop', 'workstation'], stock: 20, costPrice: 300, lowStockThreshold: 8, images: [img('1517059224940-d4af9eec41b7'), img('1593642634524-b40b5baae6bb')] },
        { sellerId: seller._id, title: 'Programmable Logic Controller (PLC) Unit', description: 'Industrial PLC unit for automated manufacturing control systems.', category: 'Promotional Merchandise', priceRange: { min: 150, max: 280 }, unit: 'piece', minOrderQty: 5, location: 'Lahore, Pakistan', tags: ['plc', 'automation', 'industrial'], stock: 14, costPrice: 110, lowStockThreshold: 5, images: [img('1581094794329-c8112a89af12'), img('1518770660439-4636190af475')] },
        { sellerId: seller._id, title: 'Industrial Cleaning Solvent (Bulk Drum)', description: 'Heavy-duty degreasing solvent for industrial cleaning applications.', category: 'Medical Apparel', priceRange: { min: 25, max: 38 }, unit: 'drum', minOrderQty: 10, location: 'Sialkot, Pakistan', tags: ['solvent', 'cleaning', 'industrial'], stock: 60, costPrice: 16, lowStockThreshold: 15, images: [img('1581578731548-c64695cc6952'), img('1532634993-15f421e42ec0')] },

        { sellerId: seller2._id, title: 'Organic Mixed Fruit Platter (Catering Pack)', description: 'Fresh organic fruit platters prepared for catering and events.', category: 'Accessories', priceRange: { min: 12, max: 18 }, unit: 'pack', minOrderQty: 25, location: 'Multan, Pakistan', tags: ['fruit', 'organic', 'catering'], stock: 150, costPrice: 7, lowStockThreshold: 30, images: [img('1518779578993-ec3579fee39f'), img('1546548970-71785318a17b')] },
        { sellerId: seller2._id, title: 'Custom Embroidered Caps (Wholesale)', description: 'Custom-branded embroidered caps available in bulk wholesale quantities.', category: "Men's Apparel", priceRange: { min: 3, max: 6 }, unit: 'piece', minOrderQty: 150, location: 'Sialkot, Pakistan', tags: ['caps', 'apparel', 'custom'], stock: 35, costPrice: 2, lowStockThreshold: 50, images: [img('1622445275576-721325763afe'), img('1601924994987-69e26d50dc26')] },
        { sellerId: seller2._id, title: 'Prefab Wooden House Frame Kit', description: 'Pre-fabricated timber house frame kit for rapid residential construction.', category: 'Safety Wear', priceRange: { min: 3500, max: 6200 }, unit: 'kit', minOrderQty: 1, location: 'Rawalpindi, Pakistan', tags: ['prefab', 'timber', 'construction'], stock: 4, costPrice: 2800, lowStockThreshold: 2, images: [img('1556156653-e5a7c69cc263'), img('1541888946425-d81bb19240f5')] },
        { sellerId: seller2._id, title: 'Fresh Farm Harvest Crates (Seasonal)', description: 'Seasonal farm-harvested produce, delivered in export-ready crates.', category: 'Tactical & Outdoor Wear', priceRange: { min: 16, max: 24 }, unit: 'crate', minOrderQty: 20, location: 'Multan, Pakistan', tags: ['harvest', 'farm', 'seasonal'], stock: 180, costPrice: 10, lowStockThreshold: 25, images: [img('1605000797499-95a51c5269ae'), img('1500937386664-56d1dfef3854')] },

        { sellerId: seller3._id, title: 'Premium Office Desk Stationery Set', description: 'Premium stationery sets for corporate offices, bulk procurement ready.', category: 'Sleepwear', priceRange: { min: 8, max: 14 }, unit: 'set', minOrderQty: 50, location: 'Lahore, Pakistan', tags: ['stationery', 'office', 'supplies'], stock: 90, costPrice: 5, lowStockThreshold: 20, images: [img('1542435503-956c469947f6'), img('1521791055366-0d553872125f')] },
        { sellerId: seller3._id, title: 'Modern Office Chair (Bulk Order)', description: 'Ergonomic modern office chairs for corporate bulk furnishing orders.', category: 'Sleepwear', priceRange: { min: 45, max: 75 }, unit: 'piece', minOrderQty: 20, location: 'Karachi, Pakistan', tags: ['furniture', 'office', 'chair'], stock: 40, costPrice: 32, lowStockThreshold: 10, images: [img('1574180045827-681f8a1a9622'), img('1517248135467-4c7edcad34c4')] },
        { sellerId: seller3._id, title: 'Gift Packaging Boxes (Wholesale)', description: 'Premium gift packaging boxes with ribbon detailing, wholesale packs.', category: 'Sleepwear', priceRange: { min: 1, max: 3 }, unit: 'piece', minOrderQty: 500, location: 'Lahore, Pakistan', tags: ['packaging', 'gift', 'boxes'], stock: 25, costPrice: 0.5, lowStockThreshold: 100, images: [img('1607344645866-009c320b63e0'), img('1574180045827-681f8a1a9622')] },
        { sellerId: seller3._id, title: 'Skincare Product Line (Private Label)', description: 'Private-label skincare line ready for retail and distribution branding.', category: 'Sleepwear', priceRange: { min: 6, max: 11 }, unit: 'piece', minOrderQty: 100, location: 'Karachi, Pakistan', tags: ['skincare', 'cosmetics', 'private label'], stock: 70, costPrice: 4, lowStockThreshold: 20, images: [img('1556228720-195a672e8a03'), img('1571781926291-c477ebfd024b')] },
      ]);

      // Demo orders — re-seeded fresh alongside products
      await Order.deleteMany({ sellerId: { $in: [seller._id, seller2._id, seller3._id] } });
      const byTitle = (t) => createdProducts.find((p) => p.title === t);
      const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
      const demoOrders = [
        { product: byTitle('Industrial Water Pump 5HP'), qty: 4,  status: 'delivered',     stage: 'done',     daysBack: 6, deliveredDaysBack: 1 },
        { product: byTitle('Basmati Rice (25kg Bag)'), qty: 60, status: 'shipped',       stage: 'done',     daysBack: 5 },
        { product: byTitle('Cotton Fabric Roll 60"'), qty: 800,status: 'ready',         stage: 'done',     daysBack: 4 },
        { product: byTitle('Solar Panel 400W Monocrystalline'), qty: 12, status: 'in-production', stage: 'stitching',daysBack: 3 },
        { product: byTitle('Portland Cement (50kg)'), qty: 150,status: 'in-production', stage: 'cutting',  daysBack: 2 },
        { product: byTitle('Urea Fertilizer (50kg)'), qty: 250,status: 'in-production', stage: 'packing',  daysBack: 2 },
        { product: byTitle('Industrial Water Pump 5HP'), qty: 6,  status: 'pending',       stage: 'cutting',  daysBack: 1 },
        { product: byTitle('Basmati Rice (25kg Bag)'), qty: 40, status: 'pending',       stage: 'cutting',  daysBack: 0 },
        { product: byTitle("Men's Cotton Hoodie (Wholesale Pack)"), qty: 300, status: 'delivered', stage: 'done', daysBack: 7, deliveredDaysBack: 2 },
        { product: byTitle('Fresh Mixed Vegetables (Export Crate)'), qty: 50, status: 'shipped', stage: 'done', daysBack: 4 },
        { product: byTitle('CNC Lathe Machine Spare Parts Kit'), qty: 8, status: 'in-production', stage: 'cutting', daysBack: 2 },
        { product: byTitle('Steel Reinforcement Bars (Rebar)'), qty: 12, status: 'pending', stage: 'cutting', daysBack: 1 },
        { product: byTitle('Heavy Duty Industrial Lathe Machine'), qty: 1, status: 'in-production', stage: 'cutting', daysBack: 3 },
        { product: byTitle('Desktop Computer Workstation Bundle'), qty: 10, status: 'delivered', stage: 'done', daysBack: 8, deliveredDaysBack: 2 },
        { product: byTitle('Modern Office Chair (Bulk Order)'), qty: 30, status: 'shipped', stage: 'done', daysBack: 5 },
        { product: byTitle('Premium Office Desk Stationery Set'), qty: 60, status: 'pending', stage: 'cutting', daysBack: 1 },
      ];

      for (const d of demoOrders) {
        const order = new Order({
          buyerId: buyer._id,
          sellerId: d.product.sellerId,
          productId: d.product._id,
          title: d.product.title,
          quantity: d.qty,
          unitPrice: d.product.priceRange.min,
          costPrice: d.product.costPrice,
          totalAmount: d.product.priceRange.min * d.qty,
          status: d.status,
          productionStage: d.stage,
          expectedDeliveryDate: daysAgo(d.daysBack - 10),
          productionStartedAt: d.status !== 'pending' ? daysAgo(d.daysBack) : null,
          shippedAt: ['shipped', 'delivered'].includes(d.status) ? daysAgo(d.deliveredDaysBack ?? 1) : null,
          deliveredAt: d.status === 'delivered' ? daysAgo(d.deliveredDaysBack ?? 1) : null,
        });
        order.createdAt = daysAgo(d.daysBack);
        await order.save();
      }

      res.json({
        message: 'Seed complete',
        admin: 'admin@tradehub.b2b / admin123',
        seller: 'seller@example.com / seller123',
        seller2: 'seller2@example.com / seller123',
        seller3: 'seller3@example.com / seller123',
        buyer: 'buyer@example.com / buyer123',
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
}

app.use(errorHandler);

async function startServer() {
  let mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.log('⚠️  No MONGODB_URI set — starting in-memory MongoDB for development...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create({
      instance: { startupTimeoutMS: 60000 },  // 60s — binary extracts on first run
    });
    mongoUri = mongod.getUri();
    console.log('✅ In-memory MongoDB started:', mongoUri);
  }

  await mongoose.connect(mongoUri);
  console.log('✅ MongoDB connected');

  const Category = require('./models/Category');
  await Category.seedDefaults();
  console.log('✅ Categories seeded');

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
}

startServer().catch((err) => {
  console.error('Server startup failed:', err.message);
  process.exit(1);
});
