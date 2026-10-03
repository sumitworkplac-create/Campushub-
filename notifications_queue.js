const admin = require("firebase-admin");

// Render ke Environment Variable se JSON read karein
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// ASN.1 parsing error theek karne ke liye newlines format karein
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://campu-6ae68-default-rtdb.firebaseio.com"
});

const db = admin.database();
console.log("Notification background service is running...");

db.ref("notifications_queue").on("child_added", async (snapshot) => {
  const notifData = snapshot.val();
  const notifId = snapshot.key;
  if (!notifData) return;

  const payload = {
    notification: {
      title: notifData.title,
      body: notifData.body,
      icon: "icon.png"
    }
  };

  try {
    const usersSnap = await db.ref("users").once("value");
    const tokens = [];
    usersSnap.forEach((user) => {
      if (user.val().fcmToken) {
        tokens.push(user.val().fcmToken);
      }
    });

    if (tokens.length > 0) {
      await admin.messaging().sendMulticast({
        tokens: tokens,
        notification: payload.notification
      });
      console.log("Push notifications sent successfully!");
    }
    await db.ref(`notifications_queue/${notifId}`).remove();
  } catch (error) {
    console.log("Error sending push notification:", error);
  }
});
