require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { getOrCreateFirebaseUser } = require('../config/firebaseAdmin');
const userStore = require('../utils/userStore');

async function seedAdmin() {
  const fbUser = await getOrCreateFirebaseUser({
    email: 'admin@tradehub.b2b',
    password: 'admin123',
    name: 'Platform Admin',
  });

  let profile = await userStore.getUserProfile(fbUser.uid);
  if (profile) {
    console.log('Admin already exists:', profile.email);
    process.exit(0);
  }

  profile = await userStore.createUserProfile(fbUser.uid, {
    name: 'Platform Admin',
    email: 'admin@tradehub.b2b',
    role: 'admin',
  });

  console.log('✅ Admin created:', profile.email, '/ Password: admin123');
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
