دعوة زفاف عبد الله ومي — مجلد جاهز للرفع على Vercel

الملفات
  index.html              الصفحة الرئيسية
  vercel.json             إعدادات الكاش والأمان
  assets/js/config.js     الإعدادات: معرّف الدعوة + إعدادات Firebase + مسارات الوسائط
  assets/js/backend.js    منطق Firestore (التهاني + تأكيد الحضور)
  assets/js/app.js        باقي السكربت
  assets/css/style.css    التنسيق
  assets/img|video|audio  الوسائط

إعداد Firebase (مرة واحدة)
  1) أنشئ مشروعاً في Firebase Console وفعّل Firestore Database.
  2) Project settings > Your apps > Web app: انسخ apiKey و authDomain و projectId و appId إلى assets/js/config.js.
  3) Firestore > Rules: الصق محتوى ملف firestore.rules (المرفق منفصلاً) ثم Publish.
  4) لكل دعوة: أنشئ مستنداً في المسار  invitations/<معرّف-الدعوة>  فيه حقل  active = true (Boolean).
     واجعل INVITATION_ID في config.js (أو ?inv=... في الرابط) مطابقاً لهذا المعرّف.

مكان البيانات
  invitations/<id>/wishes   التهاني (قراءة عامة)
  invitations/<id>/rsvps    تأكيدات الحضور (القراءة للمدير فقط: من Firebase Console)
  لإيقاف دعوة: اجعل active = false.

الرفع على Vercel
  عبر GitHub (Add New > Project > Framework Preset: Other) أو من داخل المجلد:  npx vercel --prod
