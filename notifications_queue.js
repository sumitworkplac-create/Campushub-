const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json"); // Apni file ka sahi path dein

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://campu-6ae68-default-rtdb.firebaseio.com"
});

const db = admin.database();

// Listen for new notifications in the queue
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
    // Send to a topic named 'all' (You need to subscribe users to this topic first)
    // OR send to all FCM Tokens stored in the DB
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
      // Remove from queue after sending
      await db.ref(`notifications_queue/${notifId}`).remove();
    }
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
});
