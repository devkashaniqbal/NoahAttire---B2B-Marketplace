const { getFirestoreDb } = require('../config/firebaseAdmin');

const COLLECTION = 'users';

const DEFAULTS = {
  isBanned: false,
  fcmToken: null,
  photoURL: null,
  companyName: '',
  taxId: '',
  companyAddresses: [],
  documents: [],
  notificationSettings: { email: true, sms: false, push: true },
  savedProducts: [],
  creditBalance: 0,
};

function withId(doc) {
  if (!doc.exists) return null;
  return { uid: doc.id, _id: doc.id, ...doc.data() };
}

async function createUserProfile(uid, data) {
  const db = getFirestoreDb();
  const profile = {
    ...DEFAULTS,
    name: data.name || '',
    email: (data.email || '').toLowerCase(),
    role: ['buyer', 'seller', 'admin'].includes(data.role) ? data.role : 'buyer',
    photoURL: data.photoURL || null,
    fcmToken: data.fcmToken || null,
    createdAt: new Date(),
  };
  await db.collection(COLLECTION).doc(uid).set(profile);
  return { uid, _id: uid, ...profile };
}

async function getUserProfile(uid) {
  if (!uid) return null;
  const db = getFirestoreDb();
  const doc = await db.collection(COLLECTION).doc(uid).get();
  return withId(doc);
}

async function getUserProfiles(uids) {
  const unique = [...new Set((uids || []).filter(Boolean))];
  if (!unique.length) return {};
  const db = getFirestoreDb();
  const refs = unique.map((uid) => db.collection(COLLECTION).doc(uid));
  const docs = await db.getAll(...refs);
  const map = {};
  docs.forEach((doc) => {
    const profile = withId(doc);
    if (profile) map[doc.id] = profile;
  });
  return map;
}

async function updateUserProfile(uid, partial) {
  const db = getFirestoreDb();
  await db.collection(COLLECTION).doc(uid).set(partial, { merge: true });
  return getUserProfile(uid);
}

async function incrementCreditBalance(uid, amount) {
  const { FieldValue } = require('firebase-admin/firestore');
  const db = getFirestoreDb();
  await db.collection(COLLECTION).doc(uid).set({ creditBalance: FieldValue.increment(amount) }, { merge: true });
  return getUserProfile(uid);
}

async function listUsers({ role, isBanned } = {}) {
  const db = getFirestoreDb();
  let query = db.collection(COLLECTION);
  if (role) query = query.where('role', '==', role);
  if (isBanned !== undefined) query = query.where('isBanned', '==', isBanned);
  const snap = await query.get();
  return snap.docs.map(withId);
}

async function findUserByEmail(email) {
  if (!email) return null;
  const db = getFirestoreDb();
  const snap = await db.collection(COLLECTION).where('email', '==', email.toLowerCase()).limit(1).get();
  if (snap.empty) return null;
  return withId(snap.docs[0]);
}

// Replace one or more uid string fields on a Mongoose doc (or array of docs) with an
// inline { _id, name, email, photoURL } object — mirrors what .populate('field', 'name email')
// used to return, so existing frontend code reading `order.buyerId.name` keeps working.
async function hydrate(docOrDocs, fields) {
  const isArray = Array.isArray(docOrDocs);
  const list = (isArray ? docOrDocs : [docOrDocs]).filter(Boolean);
  const plain = list.map((d) => (d?.toObject ? d.toObject() : d));

  const uids = [];
  for (const doc of plain) for (const f of fields) if (doc[f] && typeof doc[f] === 'string') uids.push(doc[f]);

  const profiles = await getUserProfiles(uids);

  for (const doc of plain) {
    for (const f of fields) {
      const uid = doc[f];
      if (uid && typeof uid === 'string' && profiles[uid]) {
        const p = profiles[uid];
        doc[f] = { _id: p.uid, name: p.name, email: p.email, photoURL: p.photoURL, isBanned: p.isBanned, createdAt: p.createdAt, fcmToken: p.fcmToken };
      }
    }
  }

  return isArray ? plain : plain[0];
}

module.exports = {
  createUserProfile,
  getUserProfile,
  getUserProfiles,
  updateUserProfile,
  listUsers,
  findUserByEmail,
  hydrate,
  incrementCreditBalance,
};
