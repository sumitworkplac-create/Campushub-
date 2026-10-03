const http = require("http");
const admin = require("firebase-admin");

// Render Health Check Server
const PORT = process.env.PORT || 10000;
http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("CampusHub Notification Worker is Live!\n");
}).listen(PORT, () => {
  console.log(`Worker listening on port ${PORT}`);
});

// Firebase Admin Initialization
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://campu-6ae68-default-rtdb.firebaseio.com"
});

const db = admin.database();
console.log("Notification background service is running...");

// notifications_queue node listener
db.ref("notifications_queue").on("child_added", async (snapshot) => {
  const notifData = snapshot.val();
  const notifId = snapshot.key;
  if (!notifData) return;

  console.log(`New notification detected in queue [${notifId}]:`, notifData.title);

  try {
    const usersSnap = await db.ref("users").once("value");
    const tokens = [];

    usersSnap.forEach((user) => {
      const data = user.val();
      if (data && data.fcmToken) {
        tokens.push(data.fcmToken);
      }
    });

    console.log(`Found ${tokens.length} FCM token(s) to send.`);

    if (tokens.length > 0) {
      const response = await admin.messaging().sendEachForMulticast({
        tokens: tokens,
        notification: {
          title: notifData.title || "CampusHub Notification",
          body: notifData.body || ""
        }
      });

      console.log(`Successfully sent: ${response.successCount}, Failed: ${response.failureCount}`);
      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            console.log(`Token ${idx} error:`, resp.error.message);
          }
        });
      }
    }

    // Process hone ke baad queue se entry hata dein
    await db.ref(`notifications_queue/${notifId}`).remove();
    console.log(`Queue item [${notifId}] removed.`);
  } catch (error) {
    console.error("Error processing notification queue:", error);
  }
});
