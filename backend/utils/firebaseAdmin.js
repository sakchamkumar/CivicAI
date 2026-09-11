const {
  cert,
  getApps,
  initializeApp,
} = require("firebase-admin/app");

const {
  getAuth,
} = require("firebase-admin/auth");

const {
  getFirestore,
} = require("firebase-admin/firestore");

const fs = require("fs");
const path = require("path");

// ============================================================
// FIREBASE ADMIN INITIALIZATION
// ============================================================

let firebaseAdminApp;

// ------------------------------------------------------------
// OPTION 1: RENDER / PRODUCTION
// Uses environment variables
// ------------------------------------------------------------

if (
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(
    /\\n/g,
    "\n"
  );

  firebaseAdminApp =
    getApps().length > 0
      ? getApps()[0]
      : initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey,
          }),
        });

  console.log("Firebase Admin initialized using environment variables.");
}

// ------------------------------------------------------------
// OPTION 2: LOCAL DEVELOPMENT
// Uses serviceAccountKey.json
// ------------------------------------------------------------

else {
  const serviceAccountPath = path.join(
    __dirname,
    "..",
    "serviceAccountKey.json"
  );

  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(
      "Firebase Admin credentials not found. " +
      "Configure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, " +
      "and FIREBASE_PRIVATE_KEY, or provide serviceAccountKey.json."
    );
  }

  const serviceAccount = require(serviceAccountPath);

  firebaseAdminApp =
    getApps().length > 0
      ? getApps()[0]
      : initializeApp({
          credential: cert(serviceAccount),
        });

  console.log(
    "Firebase Admin initialized using local serviceAccountKey.json."
  );
}

// ============================================================
// FIREBASE SERVICES
// ============================================================

const adminDb = getFirestore(firebaseAdminApp);
const adminAuth = getAuth(firebaseAdminApp);

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  firebaseAdminApp,
  adminDb,
  adminAuth,
};