// self.addEventListener("push", (event) => {
//   const data = event.data.json();
//   self.registration.showNotification(data.title, {
//     body: data.body,
//     icon: "/icon.png",
//     badge: "/badge.png",
//   });
// });

// self.addEventListener("notificationclick", (event) => {
//   event.notification.close();
//   event.waitUntil(
//     clients.openWindow("/")
//   );
// });
