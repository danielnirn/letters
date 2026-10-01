# אותיות וגמדות — Expo + Firebase

משחק איות בעברית. האתר הסטטי (`index.html`) עדיין בתיקייה; האפליקציה החדשה היא Expo.

איך המשחק עובד (שלבים, מטבעות, קטגוריות): [`GAME.md`](GAME.md).  
עבור סוכני AI / מודלים אחרים: [`AGENTS.md`](AGENTS.md).

## הרצה

```bash
cp .env.example .env
# מלאו ערכי Firebase + Google OAuth
npx expo start
```

בלי Firebase אפשר לבחור **שחק במכשיר זה בלבד** — ההתקדמות נשמרת ב-AsyncStorage במכשיר.

## Firebase

1. צרו פרויקט Firebase, הפעילו Authentication (Google + Apple) ו-Firestore.
2. העתיקו את מפתחות האפליקציה ל-`.env`.
3. פרסמו את [`firestore.rules`](firestore.rules): משתמש יכול לקרוא/לכתוב רק את `users/{uid}/**`.

### מבנה נתונים

- `users/{uid}` — `email`, `createdAt`, `plan` (`free` לעתיד מנוי), `activeProfileId`
- `users/{uid}/profiles/{profileId}` — `displayName`, `coins`, `purchases`, `inventory`, `theme`
- `users/{uid}/profiles/{profileId}/scores/{id}` — `name`, `score`, `level`, `ts`

ההורה מתחבר ב-Google/Apple. הילד הוא פרופיל עם שם, לא חשבון נפרד.

## Google / Apple

- ב-iOS חובה Sign in with Apple אם מציעים Google.
- צרו OAuth Client מסוג Web ב-Google Cloud והדביקו כ-`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.

### הפעלת Apple ב-Firebase (חובה כדי שהכפתור יעבוד)

1. [Apple Developer](https://developer.apple.com/account) → Identifiers:
   - App ID `com.letters.otiot` עם **Sign In with Apple**.
   - Services ID (לדפדפן), למשל `com.letters.otiot.web`, עם Sign In with Apple.
   - Return URL של Firebase: `https://<PROJECT_ID>.firebaseapp.com/__/auth/handler`
     (גם `https://<PROJECT_ID>.web.app/__/auth/handler` אם מופיע בקונסול).
2. Keys → מפתח חדש עם Sign In with Apple. שמרו את `.p8`, Key ID ו-Team ID.
3. Firebase Console → Authentication → Sign-in method → **Apple**:
   - הפעילו את הספק.
   - בדפדפן: Services ID, Team ID, Key ID והדבקת תוכן ה-`.p8`.
