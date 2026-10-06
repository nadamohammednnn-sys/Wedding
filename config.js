/* ===== إعدادات الدعوة: عدّل هنا فقط ===== */

/* 1) معرّف هذه الدعوة: كل دعوة لها معرّف خاص وبياناتها مستقلة تماماً في Firestore.
      يمكن تجاوزه من الرابط:  https://موقعك/?inv=abdullah-mai   (حروف إنجليزية وأرقام و - و _ فقط) */
window.INVITATION_ID = "abdullah-mai";

/* 2) إعدادات Firebase (Firebase Console > Project settings > Your apps > Web app).
      هذه القيم عامة بطبيعتها، والحماية الفعلية تأتي من Firestore Security Rules. اتركها فارغة ليعمل الحفظ على جهاز الزائر فقط */
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyAb68X3BFDfYQ8mO9SLRDkxBjQ5P0YdoqI",
  authDomain: "abdalla-def75.firebaseapp.com",
  projectId: "abdalla-def75",
  appId: "1:614778486321:web:c2726f0c46ab2c97f4df10"
};

/* 3) ملفات الوسائط */
window.__ASSET_VIDEO_MP4__ = "intro.mp4";
window.__ASSET_MUSIC_MP3__ = "music.mp3";

/* 4) صور قسم "ذكرياتنا" بالترتيب */
window.MEMORY_PHOTOS = [
  "memory-1.webp",
  "memory-2.webp",
  "memory-3.webp",
  "memory-4.webp"
];
