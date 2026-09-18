const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getAuth }      = require('firebase-admin/auth');
const { getMessaging } = require('firebase-admin/messaging');
const { getStorage }   = require('firebase-admin/storage');
const { getFirestore } = require('firebase-admin/firestore');

let initialised = false;

function getFirebaseAdmin() {
  if (initialised) return true;

  const projectId   = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey  = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('⚠️  Firebase Admin not configured — Firebase auth disabled');
    return null;
  }

  if (!getApps().length) {
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  }

  initialised = true;
  console.log('✅ Firebase Admin initialized');
  return true;
}

async function verifyFirebaseToken(idToken) {
  if (!getFirebaseAdmin()) throw new Error('Firebase Admin not configured');
  return getAuth().verifyIdToken(idToken);
}

async function sendPushNotification({ fcmToken, title, body, data = {} }) {
  if (!getFirebaseAdmin() || !fcmToken) return;
  try {
    await getMessaging().send({
      token: fcmToken,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    });
  } catch (err) {
    console.error('FCM send error:', err.message);
  }
}

function getFirebaseBucket() {
  if (!getFirebaseAdmin()) throw new Error('Firebase Admin not configured');
  return getStorage().bucket();
}

function getFirestoreDb() {
  if (!getFirebaseAdmin()) throw new Error('Firebase Admin not configured');
  return getFirestore();
}

// Get an existing Firebase Auth user by email, or create one — used by the dev seed endpoint
// since seed accounts need real Firebase Auth identities, not just Firestore profile docs.
async function getOrCreateFirebaseUser({ email, password, name }) {
  if (!getFirebaseAdmin()) throw new Error('Firebase Admin not configured');
  try {
    return await getAuth().getUserByEmail(email);
  } catch (err) {
    if (err.code !== 'auth/user-not-found') throw err;
    return getAuth().createUser({ email, password, displayName: name });
  }
}

module.exports = {
  getFirebaseAdmin,
  verifyFirebaseToken,
  sendPushNotification,
  getFirebaseBucket,
  getFirestoreDb,
  getOrCreateFirebaseUser,
};
