# 📘 Buddy Team Portal — To'liq Loyiha Hujjati

> **Loyiha nomi:** Buddy Team Portal  
> **Muallif:** Buddy Team  
> **Texnologiyalar:** React 19 + TypeScript (Frontend) | Django 5.1 + DRF (Backend)  
> **Deploy:** Frontend → Vercel | Backend → Render  

---

## 📋 Mundarija

1. [Loyiha haqida umumiy ma'lumot](#1-loyiha-haqida)
2. [Frontend tuzilmasi](#2-frontend-tuzilmasi)
3. [Backend tuzilmasi](#3-backend-tuzilmasi)
4. [Ma'lumotlar modeli (Type/Schema)](#4-malumotlar-modeli)
5. [API endpointlari](#5-api-endpointlari)
6. [WebSocket arxitekturasi](#6-websocket-arxitekturasi)
7. [Autentifikatsiya jarayoni](#7-autentifikatsiya)
8. [Deployment](#8-deployment)

---

## 1. Loyiha Haqida

**Buddy Team Portal** — bu o'quv jarayonini monitoring qilish uchun mo'ljallangan veb-platforma. Tizim uch turdagi foydalanuvchi rolini qo'llab-quvvatlaydi:

| Rol | Vazifasi |
|-----|----------|
| **Admin** | Platformaning to'liq nazorati, foydalanuvchilarni boshqarish, statistikalar |
| **Curator (Mentor)** | O'z o'quvchilari progress monitoringi, haftalik hisobotlar |
| **Student** | O'zining progress ma'lumotlarini ko'rish, kurator tanlash |

---

## 2. Frontend Tuzilmasi

### 🗂 Fayl Tuzilmasi

```
buddy-team_frontent/
│
├── index.html              # Asosiy HTML fayl (entry point)
├── index.tsx               # React ilovasi render qilish nuqtasi
├── App.tsx                 # Bosh komponent — routing, global state, API call'lar
├── api.ts                  # Axios instance, JWT interceptors
├── types.ts                # Barcha TypeScript interfeyslari
├── constants.tsx           # Statik ma'lumotlar (demo komanda a'zolari)
├── style.css               # Global CSS (Tailwind directives + custom)
├── tailwind.config.js      # Tailwind konfiguratsiyasi
├── vite.config.ts          # Vite build konfiguratsiyasi
├── tsconfig.json           # TypeScript kompilyator sozlamalari
├── postcss.config.js       # PostCSS (Tailwind uchun)
├── package.json            # NPM paketlar ro'yxati
├── vercel.json             # Vercel deploy konfiguratsiyasi (SPA routing)
├── _redirects              # Netlify uchun redirect qoidalar
│
├── components/             # Barcha UI komponentlar
│   ├── AdminPanel.tsx      # Admin boshqaruv paneli (eng katta fayl ~124KB)
│   ├── Dashboard.tsx       # Kurator/Student Dashboard (~120KB)
│   ├── AuthPage.tsx        # Login va Ro'yxatdan o'tish sahifasi
│   ├── Navbar.tsx          # Navigatsiya paneli
│   ├── Hero.tsx            # Bosh sahifa hero sektsiyasi
│   ├── HomeView.tsx        # Bosh sahifa to'liq ko'rinishi
│   ├── Team.tsx            # Kuratorlar ro'yxati sahifasi
│   ├── CuratorDetail.tsx   # Bitta kuratorning batafsil sahifasi
│   ├── Features.tsx        # Platforma xususiyatlari sahifasi
│   ├── Contact.tsx         # Bog'lanish sahifasi
│   ├── Footer.tsx          # Sahifa pastki qismi
│   ├── ChatBot.tsx         # AI chatbot (Gemini API bilan)
│   └── CustomDropdown.tsx  # Qayta ishlatiladigan dropdown komponent
│
└── services/
    └── geminiService.ts    # Google Gemini AI API bilan integratsiya
```

---

### 📄 Har Bir Faylning Batafsil Tavsifi

#### `index.html`
- Ilovaning boshlang'ich HTML fayli
- `lang="uz"` — O'zbek tili uchun optimallashtirilgan
- Google Fonts (Inter) ulangan
- `<div id="root">` — React render nuqtasi

#### `index.tsx`
- React 19 ning `createRoot` API si bilan ilova ishga tushiriladi
- `BrowserRouter` orqali routing sozlanadi
- `StrictMode` faol (development mode da double render)

#### `App.tsx` ⭐ (Asosiy fayl)
**Vazifasi:** Ilovaning markaziy boshqaruvchisi

**Nima qiladi:**
- Barcha global `state`larni saqlaydi (user, notifications, seasons, allUsers, studentsData)
- Sahifalar o'rtasida routing (`react-router-dom`)
- Barcha API call'larni amalga oshiradi va data boshqaradi
- **WebSocket ulanishini** o'rnatadi va real-time bildirishnomalarni qabul qiladi
- Har 30 soniyada ma'lumotlarni yangilaydi (polling)
- `localStorage` orqali sessiyani saqlaydi

**Asosiy Handler funksiyalar:**

| Funksiya | Vazifasi |
|----------|----------|
| `handleLoginSuccess` | Login bo'lgach, user ma'lumotini saqlaydi va yo'naltiradi |
| `handleLogout` | Tokenlarni o'chiradi, bosh sahifaga qaytaradi |
| `handleUpdateProfile` | Foydalanuvchi profilini API orqali yangilaydi |
| `handleAddProgress` | Yangi haftalik monitoring yozuvi qo'shadi |
| `handleUpdateStudent` | Mavjud monitoring yozuvini yangilaydi |
| `handleDeleteUser` | Foydalanuvchini o'chiradi (faqat Admin) |
| `handleApproveUser` | Kuratorni tasdiqlaydi (faqat Admin) |
| `handleAssignCurator` | Student o'z kuratorini tanlaydi |
| `handleStartNewSeason` | Yangi o'quv mavsumini boshlaydi |
| `handleAddNotification` | Bildirishnoma yuboradi |

---

#### `api.ts` ⭐
**Vazifasi:** Backend bilan barcha HTTP aloqalarning markazi

**Nima qiladi:**
- `axios.create()` bilan sozlangan instance yaratadi
- **Request Interceptor:** Har bir so'rovga `Authorization: Bearer <token>` headerini qo'shadi
- **Response Interceptor:** 
  - `401 Unauthorized` xatosi kelsa, refresh token orqali avtomatik yangi access token oladi
  - Refresh ham muvaffaqiyatsiz bo'lsa, tokenlarni o'chirib, login sahifasiga yo'naltiradi
- `WS_URL` — WebSocket ulanish manzilini eksport qiladi

```typescript
// API manzili (Render.com)
const API_URL = 'https://buddy-backend-v1-1.onrender.com/api/v1/';
```

---

#### `types.ts` ⭐
**Vazifasi:** Butun loyiha bo'ylab ishlatiladigan TypeScript tiplari

| Interface | Maydalar | Vazifasi |
|-----------|----------|----------|
| `UserData` | id, name, username, email, role, status, avatar, field, longBio, skills, socialLinks, assignedCuratorId | Foydalanuvchi ma'lumotlari |
| `StudentProgress` | id, curatorId, seasonId, weekNumber, studentName, weeklyGoal, difficulty, solution, status, meetingDay, attended | Haftalik monitoring yozuvi |
| `Season` | id, number, startDate, isActive, durationInMonths | O'quv mavsumi |
| `WeeklyHighlight` | id, curatorId, seasonId, weekNumber, photoUrl, image | Haftalik muvaqqiyat rasmlari |
| `Notification` | id, title, message, type, timestamp, isRead, targetRole, sender | Bildirishnoma |
| `TeamMember` | id, name, role, avatar, bio, skills, socialLinks | Jamoa a'zosi (kuratorlar sahifasi) |
| `Message` | role, text | Chat xabari |
| `Page` | `'home' \| 'features' \| 'team' \| 'contact' \| 'auth' \| 'dashboard' \| 'admin'` | Sahifa nomlari |

---

#### `components/AdminPanel.tsx` ⭐ (124KB)
**Foydalanuvchi:** Faqat `admin` roli

**Tablar (Bo'limlar):**

| Tab | Vazifasi |
|-----|----------|
| `stats` | Platforma statistikasi — aktiv kuratorlar, o'quvchilar, muvaffaqiyat foizi, grafiklar (Recharts) |
| `monitoring` | Barcha kuratorlarning haftalik monitoring jadvali — filtr, qidiruv, tahrirlash |
| `users` | Barcha foydalanuvchilar jadvals — role filtr, qidiruv, ko'rish, o'chirish |
| `requests` | Tasdiqlash kutayotgan kuratorlar — profil ko'rish va tasdiqlash |
| `seasons` | Mavsum boshqaruvi — yangi mavsum yaratish, tahrirlash, o'chirish |
| `messages` | Global bildirishnomalar — yuborish tarixi, o'qilmagan xabarlar |
| `settings` | Tizim sozlamalari — registratsiya ochiq/yopiq, bildirishnoma sozlamalari |

**Qo'shimcha xususiyatlar:**
- Foydalanuvchi profilini modal oynada ko'rish
- Kuratorga to'g'ridan-to'g'ri xabar yuborish (Direct Message)
- Monitoring ma'lumotlarini **Excel** formatida eksport qilish (`xlsx` kutubxona)
- Sahifalash (Pagination) — 15 ta yozuv per sahifa
- Responsiv mobil yon panel (1111px dan past ekranlarda)

---

#### `components/Dashboard.tsx` ⭐ (120KB)
**Foydalanuvchi:** `curator` va `student` rollari

**Tablar:**

| Tab | Rol | Vazifasi |
|-----|-----|----------|
| `monitoring` | Curator/Admin | Haftalik monitoring jadvali — o'quvchi qo'shish, tahrirlash |
| `students` | Curator | O'ziga biriktirilgan o'quvchilar ro'yxati — biriktirish/ajratish |
| `highlights` | Curator | Haftalik muvaqqiyat rasmlari — yuklash, ko'rish, o'chirish |
| `profile` | Hammasi | Profil ko'rish va tahrirlash — tarjimai hol, ko'nikmalar, ijtimoiy tarmoqlar, avatar |
| `notifications` | Hammasi | Bildirishnomalar ro'yxati — o'qilmagan belgilash |

**Qo'shimcha xususiyatlar:**
- Foydalanuvchi profil rasmini kamera orqali yoki fayldan yuklash
- AI ChatBot (Gemini) — sidebar panel
- Real-time onlayn foydalanuvchilar indikatori
- Mobile responsiv jadvallar va kartochka ko'rinishi

---

#### `components/AuthPage.tsx`
**Vazifasi:** Login va ro'yxatdan o'tish

**Login jarayoni:**
1. Username/parol kiritiladi
2. `POST /api/v1/auth/token/` — JWT tokenlar olinadi
3. `GET /api/v1/auth/me/` — Foydalanuvchi ma'lumotlari yuklanadi
4. Role bo'yicha yo'naltirish (`admin` → `/admin`, boshqalar → `/dashboard`)

**Ro'yxatdan o'tish:**
- Student va Curator uchun alohida forma
- Curator uchun **Intra 21 School** autentifikatsiyasi qo'shimcha tekshiruv (`/api/v1/auth/validate-intra/`)
- Status: Student — `active`, Curator — `pending` (Admin tasdiqlashi kerak)

---

#### `components/Team.tsx`
**Vazifasi:** Faol kuratorlar ro'yxatini ko'rsatish

- Student bo'lmagan o'quvchi barcha kuratorlarni ko'radi va birini tanlaydi
- Student kurator tanlagan bo'lsa, faqat o'z kuratorini ko'radi
- Har bir kurator kartida — rasm, ism, yo'nalish, ko'nikmalar, ijtimoiy tarmoqlar

---

#### `components/CuratorDetail.tsx`
**Vazifasi:** Bitta kuratorning to'liq profili va haftalik monitoring hisoboti

- Kurator bio, ko'nikmalar, motivatsion so'z
- Mavsum va hafta filtri
- Barcha o'quvchilarning haftalik monitoring jadvali
- Desktop jadvali (>1280px) va mobil kartochkalar ko'rinishi

---

#### `components/Navbar.tsx`
**Vazifasi:** Asosiy navigatsiya paneli

- Logo va brending
- Sahifalar o'rtasida havolalar
- Autentifikatsiya holati (login/logout tugmasi)
- O'qilmagan bildirishnomalar soni badge
- Mobil menyu (hamburger)

---

#### `components/ChatBot.tsx`
**Vazifasi:** AI yordamchi

- Google Gemini API (`@google/genai`) bilan integratsiya
- Foydalanuvchi savol beradi, AI javob qaytaradi
- Chat tarixi `localStorage` da saqlanadi va backend'ga sync bo'ladi

---

#### `components/CustomDropdown.tsx`
**Vazifasi:** Qayta ishlatiladigan dropdown tanlash elementi

- `options`, `value`, `onChange`, `placeholder` props qabul qiladi
- Ikonkali variantlarni qo'llab-quvvatlaydi
- CSS animatsiyali ochilish/yopilish

---

#### `services/geminiService.ts`
**Vazifasi:** Google Gemini AI API bilan aloqa

- `@google/genai` kutubxona orqali chat sessiyasi yaratadi
- Buddy Team kontekstini system prompt sifatida beradi
- Stream yoki bir martalik javob olish imkoniyati

---

#### `constants.tsx`
**Vazifasi:** Statik demo ma'lumotlar

- `TEAM_MEMBERS` — fallback kuratorlar ro'yxati (agar API dan kelmasa)
- `FEATURES` — platforma xususiyatlari

---

### 📦 Ishlatiladigan Kutubxonalar (Frontend)

| Paket | Versiya | Vazifasi |
|-------|---------|----------|
| `react` | 19.2.4 | UI kutubxona |
| `react-dom` | 19.2.4 | DOM rendering |
| `react-router-dom` | 7.13.1 | Client-side routing |
| `axios` | 1.13.6 | HTTP so'rovlar |
| `framer-motion` | 12.34.5 | Animatsiyalar (AdminPanel drawer) |
| `lucide-react` | 0.563.0 | Ikonkalar to'plami |
| `recharts` | 3.7.0 | Statistika grafiklar (Admin) |
| `xlsx` | 0.18.5 | Excel eksport (Admin monitoring) |
| `@google/genai` | 1.38.0 | Google Gemini AI ChatBot |
| `tailwindcss` | 3.4.19 | Utility-first CSS |
| `vite` | 6.2.0 | Build tool va dev server |
| `typescript` | 5.8.2 | Tip xavfsizligi |

---

## 3. Backend Tuzilmasi

### 🗂 Fayl Tuzilmasi

```
buddy-team_backend/
│
├── manage.py               # Django boshqaruv skripti
├── requirements.txt        # Python paketlar ro'yxati
├── .env                    # Muhit o'zgaruvchilari (SECRET_KEY, DB URL, REDIS URL)
├── Dockerfile              # Docker konteyner konfiguratsiyasi
├── docker-compose.yml      # Docker Compose (local multi-container)
├── entrypoint.sh           # Docker ishga tushish skripti (migrate + collectstatic)
├── render-build.sh         # Render.com build skripti
├── create_superuser_automatic.py  # Avtomatik superuser yaratish
├── keep_alive.py           # Render.com uyqu rejimiga kirmasligi uchun ping
├── db.sqlite3              # SQLite ma'lumotlar bazasi (local)
│
├── config/                 # Django loyiha konfiguratsiyasi
│   ├── settings.py         # Barcha Django sozlamalari
│   ├── urls.py             # Bosh URL yo'riqnomasi
│   ├── asgi.py             # ASGI (WebSocket uchun Daphne)
│   ├── wsgi.py             # WSGI (eski HTTP serverlar uchun)
│   └── celery.py           # Celery task queue konfiguratsiyasi
│
├── api/                    # Asosiy API ilovasi
│   ├── models.py           # Ma'lumotlar bazasi modellari
│   ├── serializers.py      # JSON ↔ Python konversiya
│   ├── views.py            # API endpoint logic
│   ├── urls.py             # API URL yo'riqnomalari
│   ├── consumers.py        # WebSocket handlers (Django Channels)
│   ├── routing.py          # WebSocket URL routing
│   ├── signals.py          # Django signals (avtomatik trigger)
│   ├── admin.py            # Django admin panel konfiguratsiyasi
│   ├── middleware.py        # Custom middleware
│   ├── apps.py             # Ilova konfiguratsiyasi
│   └── migrations/         # Ma'lumotlar bazasi migratsiya fayllari
│
├── media/                  # Yuklangan fayllar (avatar, rasmlar)
└── staticfiles/            # To'plangan statik fayllar (Whitenoise uchun)
```

---

### 📄 Backend Fayllarining Batafsil Tavsifi

#### `config/settings.py` ⭐
**Vazifasi:** Django ning barcha sozlamalari

**Asosiy konfiguratsiyalar:**

| Sozlama | Qiymati | Maqsadi |
|---------|---------|---------|
| `AUTH_USER_MODEL` | `'api.User'` | Custom User modeli |
| `DATABASES` | PostgreSQL (prod) / SQLite (local) | Ma'lumotlar bazasi |
| `CHANNEL_LAYERS` | Redis (channels-redis) | WebSocket xabar kanallari |
| `CELERY_BROKER_URL` | Redis URL | Async vazifalar navbati |
| `CORS_ALLOWED_ORIGINS` | Vercel domenlar | Frontend domenlari ruxsat |
| `SIMPLE_JWT` | Access: 30 soat, Refresh: 7 kun | JWT token muddati |
| `INSTALLED_APPS` | daphne, channels, rest_framework, ... | O'rnatilgan ilovalar |
| `TIME_ZONE` | `Asia/Tashkent` | Toshkent vaqt zonasi |
| `LANGUAGE_CODE` | `uz-uz` | O'zbek tili |

---

#### `api/models.py` ⭐
**Vazifasi:** Barcha ma'lumotlar bazasi modellari

#### `User` (AbstractUser dan meros)
```
- id: UUID (primary key)
- username: Foydalanuvchi nomi (unique)
- email: Elektron pochta
- name: To'liq ism
- role: 'admin' | 'curator' | 'student'
- status: 'active' | 'inactive' | 'pending'
- avatar: Rasm fayli (media/avatars/)
- field: Mutaxassislik sohasi (100 char)
- long_bio: Tarjimai hol (TextField)
- field_description: Soha haqida (TextField)
- motivation_quote: Motivatsion so'z (150 char)
- skills: Ko'nikmalar (JSONField — list)
- is_approved: Tasdiqlangan (Boolean)
- assigned_curator: O'z kuratori (self ForeignKey)
```

#### `SocialLink`
```
- user: ForeignKey(User)
- icon_image: Ijtimoiy tarmoq belgisi rasmi
- link_url: Havola manzili (URLField)
```

#### `Season` (O'quv mavsumi)
```
- id: UUID
- number: Mavsum raqami (unique)
- start_date: Boshlanish sanasi
- is_active: Faol mavsum (Boolean)
- duration_months: Davomiyligi (oylar)
```

#### `Monitoring` (Haftalik monitoring)
```
- id: UUID
- curator: ForeignKey(User, curator)
- season: ForeignKey(Season)
- week_number: Hafta raqami
- student: ForeignKey(User, student)
- student_name: O'quvchi ismi (text)
- weekly_goal: Haftalik maqsad (TextField)
- difficulty: Asosiy muammo (TextField)
- solution: Berilgan yechim (TextField)
- status: 'Kutilmoqda' | 'Bajarilmoqda' | 'Hal qilindi' | 'Bajarmadi'
- meeting_day: Uchrashuv sanasi va vaqti (DateTimeField)
- attended: Davomati (Boolean)
```

#### `WeeklyHighlight` (Haftalik muvaqqiyat rasmi)
```
- id: UUID
- curator: ForeignKey(User)
- season: ForeignKey(Season)
- week_number: Hafta raqami
- photo_url: Rasm URL manzili (legacy)
- image: Rasm fayli (media/highlights/)
- uploaded_by: Kim yuklagan
```

#### `Notification` (Bildirishnoma)
```
- id: UUID
- title: Sarlavha (255 char)
- message: Xabar matni (TextField)
- type: 'info' | 'success' | 'warning' | 'urgent'
- timestamp: Yuborilgan vaqt (auto)
- is_read: O'qilganmi (Boolean)
- target_role: 'all' | 'admin' | 'curator' | 'student' | 'none'
- target_user: ForeignKey(User, null) — shaxsiy xabar
- sender: Yuboruvchi ismi
```

#### `ChatMessage` (AI Chat tarixi)
```
- id: UUID
- user: ForeignKey(User)
- role: 'user' | 'model'
- text: Xabar matni
- timestamp: Vaqt (auto)
```

#### `PlatformSetting` (Tizim sozlamalari)
```
- key: Sozlama kalit (unique, primary key)
- value: Qiymat (text)
- description: Tavsif
```

---

#### `api/serializers.py` ⭐
**Vazifasi:** Python modellari ↔ JSON konversiyasi

| Serializer | Model | Asosiy xususiyatlari |
|-----------|-------|---------------------|
| `UserSerializer` | User | camelCase konversiya, Base64 rasm qabul qilish, Parol xavfsiz saqlash, SocialLink nested |
| `RegisterSerializer` | User | Ro'yxatdan o'tish validatsiyasi |
| `SeasonSerializer` | Season | camelCase fieldlar |
| `MonitoringSerializer` | Monitoring | Related fieldlar UUID sifatida |
| `WeeklyHighlightSerializer` | WeeklyHighlight | Rasm URL va fayl qo'llab-quvvatlash |
| `NotificationSerializer` | Notification | targetRole, targetUserId, isRead |
| `ChatMessageSerializer` | ChatMessage | Barcha maydonlar |
| `PlatformSettingSerializer` | PlatformSetting | Barcha maydonlar |

**`Base64ImageField`** — Maxsus rasm maydoni:
- Base64 string → Fayl konversiyasi
- HTTP URL → Mavjud fayl yo'li konversiyasi
- Bo'sh qiymatlarni to'g'ri boshqarish

---

#### `api/views.py` ⭐
**Vazifasi:** API so'rovlarini qayta ishlash

**ViewSetlar:**

| ViewSet | Endpoint | Ruxsatlar |
|---------|----------|-----------|
| `UserViewSet` | `/api/v1/users/` | Authenticated |
| `SeasonViewSet` | `/api/v1/seasons/` | Authenticated |
| `MonitoringViewSet` | `/api/v1/monitoring/` | Authenticated |
| `WeeklyHighlightViewSet` | `/api/v1/highlights/` | Authenticated |
| `NotificationViewSet` | `/api/v1/notifications/` | Authenticated |
| `PlatformSettingViewSet` | `/api/v1/settings/` | Admin only |

**Alohida API funksiyalar:**

| Funksiya | Method | Endpoint | Vazifasi |
|---------|--------|----------|----------|
| `RegisterView` | POST | `/api/v1/auth/register/` | Ro'yxatdan o'tish |
| `me` | GET | `/api/v1/auth/me/` | Joriy foydalanuvchi ma'lumotlari |
| `validate_intra` | POST | `/api/v1/auth/validate-intra/` | Intra 21 School tekshirish |
| `admin_stats` | GET | `/api/v1/admin/stats/` | Platforma statistikasi |
| `admin_user_role` | PATCH | `/api/v1/admin/users/<id>/role/` | Foydalanuvchi rolini o'zgartirish |
| `admin_user_status` | PATCH | `/api/v1/admin/users/<id>/status/` | Status o'zgartirish |
| `admin_user_approve` | POST | `/api/v1/admin/users/<id>/approve/` | Kuratorni tasdiqlash |
| `admin_notification_send` | POST | `/api/v1/admin/notifications/send/` | Global bildirishnoma yuborish |

---

#### `api/consumers.py` ⭐
**Vazifasi:** Real-time WebSocket aloqasi

**`NotificationConsumer`:**
- Foydalanuvchi WebSocket orqali ulanadi
- Ulanish manzili: `wss://buddy-backend.../ws/notifications/?token=<JWT>`
- Ulanib 3 ta guruhga qo'shiladi:
  - `user_<id>` — faqat shu foydalanuvchi uchun
  - `role_<role>` — shu roldagi barcha foydalanuvchilar
  - `all_users` — hamma
- Xabar turlari: `notification`, `monitoring_update`, `user_status`

**`ChatConsumer`:**
- Foydalanuvchilar orasida real-time xat
- Ulanish manzili: `wss://buddy-backend.../ws/chat/?token=<JWT>`
- Ikki foydalanuvchi orasida bir-biriga xabar yuborish

---

#### `api/signals.py`
**Vazifasi:** Avtomatik trigger funksiyalar

- Yangi `Monitoring` yozuvi yaratilsa → WebSocket orqali barcha tegishli foydalanuvchilarga bildirishnoma
- Yangi `Notification` yaratilsa → tegishli guruhga WebSocket push yuborish

---

#### `config/asgi.py`
**Vazifasi:** ASGI server konfiguratsiyasi

- **Daphne** ASGI server bilan ishlaydi
- HTTP so'rovlar → Django URL dispatcher
- WebSocket so'rovlar → Channels routing (`/ws/`)

#### `config/celery.py`
**Vazifasi:** Asinxron vazifalar

- Fon vazifalar uchun Celery worker
- Redis broker sifatida ishlatiladi
- `keep_alive.py` fayli orqali Render uyqu rejimiga kirmasligi uchun ping yuboradi

---

#### `entrypoint.sh`
**Vazifasi:** Docker container ishga tushganda:
1. `python manage.py migrate` — migratsiyalar
2. `python manage.py collectstatic --noinput` — statik fayllar
3. `python create_superuser_automatic.py` — admin foydalanuvchi
4. `daphne -b 0.0.0.0 -p $PORT config.asgi:application` — server ishga tushadi

---

### 📦 Ishlatiladigan Kutubxonalar (Backend)

| Paket | Vazifasi |
|-------|----------|
| `django==5.1.2` | Web framework |
| `djangorestframework` | REST API qurilishi |
| `djangorestframework-simplejwt` | JWT autentifikatsiya |
| `django-cors-headers` | CORS sozlamalari |
| `drf-spectacular` | OpenAPI/Swagger hujjatlash |
| `channels` | Django Channels (WebSocket) |
| `daphne` | ASGI server (Channels uchun) |
| `channels-redis` | Redis Channel Layer |
| `celery` | Asinxron vazifalar |
| `django-celery-results` | Celery natijalarini DB da saqlash |
| `django-celery-beat` | Vaqtlangan vazifalar |
| `redis` | Redis client |
| `pillow` | Rasm qayta ishlash |
| `psycopg2-binary` | PostgreSQL driver |
| `whitenoise` | Statik fayllarni serve qilish |
| `dj-database-url` | DATABASE_URL env var parsing |
| `python-dotenv` | `.env` fayl o'qish |
| `gunicorn` | WSGI server (backup) |

---

## 4. Ma'lumotlar Modeli

```
User (1) ─────────────────── (N) SocialLink
  │
  ├─── (1) ──── (N) Monitoring (as curator)
  ├─── (1) ──── (N) Monitoring (as student)
  ├─── (1) ──── (N) WeeklyHighlight
  ├─── (1) ──── (N) Notification (target_user)
  ├─── (1) ──── (N) ChatMessage
  └─── (N) ──── (1) User (assigned_curator → students)

Season (1) ── (N) Monitoring
Season (1) ── (N) WeeklyHighlight
```

---

## 5. API Endpointlari

### Autentifikatsiya
| Method | Endpoint | Vazifasi |
|--------|----------|----------|
| POST | `/api/v1/auth/register/` | Ro'yxatdan o'tish |
| POST | `/api/v1/auth/token/` | JWT tokenlar olish (Login) |
| POST | `/api/v1/auth/token/refresh/` | Access token yangilash |
| GET | `/api/v1/auth/me/` | Joriy foydalanuvchi |
| POST | `/api/v1/auth/validate-intra/` | Intra 21 tekshirish |

### Foydalanuvchilar
| Method | Endpoint | Vazifasi |
|--------|----------|----------|
| GET | `/api/v1/users/` | Barcha foydalanuvchilar |
| GET | `/api/v1/users/<id>/` | Bitta foydalanuvchi |
| PATCH | `/api/v1/users/<id>/` | Profil yangilash |
| DELETE | `/api/v1/users/<id>/` | O'chirish |

### Monitoring
| Method | Endpoint | Vazifasi |
|--------|----------|----------|
| GET | `/api/v1/monitoring/` | Barcha yozuvlar |
| POST | `/api/v1/monitoring/` | Yangi yozuv |
| PATCH | `/api/v1/monitoring/<id>/` | Tahrirlash |
| DELETE | `/api/v1/monitoring/<id>/` | O'chirish |

### Mavsumlar
| Method | Endpoint | Vazifasi |
|--------|----------|----------|
| GET | `/api/v1/seasons/` | Barcha mavsumlar |
| POST | `/api/v1/seasons/` | Yangi mavsum |
| PATCH | `/api/v1/seasons/<id>/` | Mavsum yangilash |
| DELETE | `/api/v1/seasons/<id>/` | Mavsum o'chirish |

### Bildirishnomalar
| Method | Endpoint | Vazifasi |
|--------|----------|----------|
| GET | `/api/v1/notifications/` | Barcha bildirishnomalar |
| POST | `/api/v1/notifications/` | Yuborish |
| PATCH | `/api/v1/notifications/<id>/` | O'qilgan belgilash |

### Haftalik Rasmlar
| Method | Endpoint | Vazifasi |
|--------|----------|----------|
| GET | `/api/v1/highlights/` | Barcha rasmlar |
| POST | `/api/v1/highlights/` | Rasm yuklash (multipart/form-data) |
| DELETE | `/api/v1/highlights/<id>/` | O'chirish |

### Admin
| Method | Endpoint | Vazifasi |
|--------|----------|----------|
| GET | `/api/v1/admin/stats/` | Platforma statistikasi |
| PATCH | `/api/v1/admin/users/<id>/role/` | Rol o'zgartirish |
| PATCH | `/api/v1/admin/users/<id>/status/` | Status o'zgartirish |
| POST | `/api/v1/admin/users/<id>/approve/` | Kuratorni tasdiqlash |

---

## 6. WebSocket Arxitekturasi

```
Foydalanuvchi (Browser)
       │
       │  wss://buddy-backend.../ws/notifications/?token=<JWT>
       ▼
    Daphne (ASGI Server)
       │
       ▼
    Django Channels
       │
       ├── NotificationConsumer
       │       ├── Guruh: user_<id>     (shaxsiy xabarlar)
       │       ├── Guruh: role_curator  (kurator xabarlari)
       │       ├── Guruh: all_users     (barcha xabarlar)
       │       └── Guruh: online_users  (onlayn holat)
       │
       └── ChatConsumer
               └── Guruh: chat_<user_id>
                       │
                Redis Channel Layer
```

**Xabar turlari:**
- `notification` — yangi bildirishnoma
- `monitoring_update` — monitoring o'zgarishi
- `user_status` — foydalanuvchi onlayn/offline holati
- `chat_message` — chat xabari

---

## 7. Autentifikatsiya

```
1. POST /auth/token/
   ← { access: "eyJ...", refresh: "eyJ..." }
   
2. localStorage ga saqlash:
   - access_token = "eyJ..."
   - refresh_token = "eyJ..."
   
3. Har bir API so'rovda:
   Authorization: Bearer eyJ...
   
4. 401 xatosi kelsa:
   POST /auth/token/refresh/ → yangi access_token
   
5. Refresh ham muvaffaqiyatsiz:
   Tokenlarni o'chirish → /auth sahifasiga yo'naltirish
```

**Token muddatlari:**
- Access Token: **30 soat**
- Refresh Token: **7 kun**

---

## 8. Deployment

### Frontend (Vercel)
- **URL:** `https://buddy-team-frontent.vercel.app`
- Build command: `vite build`
- Output dir: `dist/`
- `vercel.json` — barcha route'larni `index.html` ga yo'naltiradi (SPA routing)

### Backend (Render.com)
- **URL:** `https://buddy-backend-v1-1.onrender.com`
- Docker konteyner orqali deploy
- `entrypoint.sh` — ishga tushish skripti
- **PostgreSQL** — Render managed DB
- **Redis** — Render managed Redis (WebSocket + Celery)
- `keep_alive.py` — Render free tier uyqu rejimiga kirmasligi uchun har 10 daqiqada ping

### Muhit O'zgaruvchilari (.env)
```env
SECRET_KEY=         # Django secret key
DATABASE_URL=       # PostgreSQL ulanish URL
REDIS_URL=          # Redis ulanish URL
DEBUG=False         # Ishlab chiqarish rejimi
ALLOWED_HOSTS=      # Ruxsat etilgan domenlar
```

---

*Hujjat yozilgan vaqt: 2026-03-12 | Buddy Team Portal v1.0*
