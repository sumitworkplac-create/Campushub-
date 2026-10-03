importScripts('https://www.gstatic.com/firebasejs/12.19.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAOpJD_QrDLccFN-Zd_Rl8uRcLLpu96G4o",
  projectId: "campu-6ae68",
  messagingSenderId: "672693690045",
  appId: "1:672693690045:web:b8a443d26ec582b028e1d4"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: 'icon.png' // Mewar Logo
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
