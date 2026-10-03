const admin = require("firebase-admin");

// Direct initialization using verified service account configuration
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: "campu-6ae68",
    clientEmail: "firebase-adminsdk-fbsvc@campu-6ae68.iam.gserviceaccount.com",
    privateKey: `-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDYj8SS/EoCV7yh\nkyZXUpIQAQNlIm4cCXdJgmjZmHdw9pF6/uM9fW5trq1UQi1CERhUntdbYY/Th2dt\nH8Dn559zKq5k/RinJkmA0gYXMMgignvEbC5Kjmj+h0z4dZogCInevh9HbQ2MPC+V\n5hoV6v/nHaODxNoWGUPcJW9RoRf+DU2RrUIzkxBu/ZwxtzcP2+FlRpaX/f2ocgVy\n1nQoMFFqe8Yee0vgK4lDJcIv26mxzMyelJRNynyjQ21lsMHHPsBrDq3OfQrgSZDt\nLhTTg3Tm9Wzrzm0ACq2zv8XZ3frZXOJXy7qv5V8mLUOuB7UAEfs4PzQIoAE8AfiX\nq3oUjas3AgMBAAECggEAImaQENM/xGiAf+AanpNwvVcT3XxfJlgAmW48TphwHMMm\L/YOTeW/ZW/ye6h5fP2vMj37MrpoOO9Q6B47q/r4srgsdMFZqa+kzHBQZF2s5QJ6\nO6T9o31Ew23ltbAkuALzN61W1adGmCi1XGfta97lIKbuIw/hntILnAxcRwjCgWn7\nrsvr6LJ4n+6LZIZQsrrRHLTtgApayijEKJJhbCsq2V5aO9v8z5q9qfrDa2pFwZai\nmL36NpnibCLt0pxWjUg5LZX1EMdiGS0yWpNpmmUL+fFY3oZSZSc76lET4c9Um6lb\nG9QxthGBLqPAcs2hWVZTjCUwar26JpvbOir+Myc94QKBgQD2doXCEhZ7Cxk9N+hK\neub8QvwREVM8VixbVcVGgoVXBuquU4l9Kky1mqJlxUWhn3ET1jpmWyB7IunX2ysm\Zo41ylykx3GEyThr0YTJtgGDCRG16cSJGv9OYb8TIv0txwK55tZZ9vbcgnqb5sMY\nmjej0Tz1I7vIdPLcib8xakbrVwKBgQDg8QpX5dITtttAkWEfMCjYs+19jBScAT6v\nbdibnWpg1RJjOBWVIR7wqEspaUDh7EIFJtCoa1PaLjib9VCSyun/kqN8eXEJYKvq\nzBFCBYDnIhupu3Jde7twZbAJQ3tRXnxFTlcAWHUmVdI6PQe+3MGYBu16OHV+P/ug\J33jRlEzIQKBgBfEdkGw3Nogx95Pdec40u2gyA4dTZmT9dMZAl06WQF7eUY2aBvZ\n6Gva7a5Cx+Q+K/ltv1P/lbJKO6LFT/P0D+LAEQ8S7K+ReA9ttRB+rMamKT8RvBI8\nuEImyvZdeWzgtDKZQDKMzmGVc511M3s75AG4O9ioCYPbQ1BhOD7bsNshAoGBALoE\nGv2dPCC5co7uqlZUSTMLeDX+hXyNOv1v5VSq1LHHAjGyy4ZLoX56bc2NEO7DpcUE\2ECuoOUom/+82ijKTL/gz/m7o9KRcxn0L8FdM7/v4Nh3/pd4HwVP0keW2n/rlvDp\nW+EZRaeyCOvIVINto1rJP9F2pxMEbl1+ywgLulKBAoGAXgHsdMb1ft/Sj0B5hrPY\nwREHBIukYcCK5ZXsyxil5vAiQOhKKY9mzII/O/Ca0mEEKUoUx6rZy6Wl7g/G6b/c\nPvOz2s+Y7jCzY+AxnnL9RB7nXPbN7N9fdGwgDA5AMhGy4iHaPmZSDO5ikXDyZi4T\nnEjhIPyQKWZFaqcN4+ooLCk=\n-----END PRIVATE KEY-----`
  }),
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
    usersSnap.forEach(user => {
      if(user.val().fcmToken) { tokens.push(user.val().fcmToken); }
    });

    if(tokens.length > 0) {
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
