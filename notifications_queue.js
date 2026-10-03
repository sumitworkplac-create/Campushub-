const admin = require("firebase-admin");

// Using Environment Variables to avoid JSON file signature issues
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // Replacing escaped newlines for private key
    privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined
  }),
  databaseURL: "https://campu-6ae68-default-rtdb.firebaseio.com"
});

const db = admin.database();

console.log("Notification background service is running...");

db.ref("notifications_queue").on("child_added", async (snapshot) => {
  const notifData = snapshot.val();
  const notifId = snapshot.key;

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
    usersSnap.forEach(user => {
      if(user.val().fcmToken) { tokens.push(user.val().fcmToken); }
    });

    if(tokens.length > 0) {
      await admin.messaging().sendMulticast({
        tokens: tokens,
        notification: payload.notification
      });
      console.log("Push notifications sent successfully!");
      await db.ref(`notifications_queue/${notifId}`).remove();
    }
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
});
