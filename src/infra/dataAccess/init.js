Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.storage = void 0;
exports.getFirebaseAdmin = getFirebaseAdmin;
var firebase_admin_1 = require("firebase-admin");
function getFirebaseAdmin() {
  if (!firebase_admin_1.default.apps.length) {
    try {
      var serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT || "{}",
      );
      firebase_admin_1.default.initializeApp({
        credential: firebase_admin_1.default.credential.cert(serviceAccount),
        storageBucket: process.env.STORAGE_BUCKET,
      });
    } catch (error) {
      console.log(
        "Firebase admin initialization error",
        error === null || error === void 0 ? void 0 : error.stack,
      );
    }
  }
  return firebase_admin_1.default;
}
exports.storage = getFirebaseAdmin().storage();
exports.db = getFirebaseAdmin().firestore();
