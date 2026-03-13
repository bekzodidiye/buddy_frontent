# BuddyPanel Backend Technical Specification & PRD

## 1. Loyiha haqida umumiy ma'lumot (Project Overview)
**BuddyPanel** — bu o'quvchilar va ularning kuratorlari (mentorlari) o'rtasidagi haftalik monitoring jarayonini boshqarish, uchrashuv lavhalarini saqlash va platforma statistikasini yuritish uchun mo'ljallangan tizim. Backend qismi Python/Django frameworkida REST API ko'rinishida ishlab chiqiladi.

---

## 2. Foydalanuvchi rollari va ruxsatnomalar (User Roles & Permissions)

| Rol | Tavsif | Ruxsatnomalar |
| :--- | :--- | :--- |
| **Admin** | Platforma boshqaruvchisi | Barcha foydalanuvchilar, mavsumlar, monitoringlar va bildirishnomalarni boshqarish. |
| **Curator** | Mentor/Kurator | O'ziga biriktirilgan o'quvchilar progressini kiritish, uchrashuv rasmlarini yuklash. |
| **Student** | O'quvchi | O'z progressini ko'rish, bildirishnomalarni o'qish, kurator tanlash. |

---

## 3. Ma'lumotlar bazasi arxitekturasi (Data Models)

### 3.1. `User` (Foydalanuvchi)
Django `AbstractUser` modelidan meros oladi.
- `id`: `UUIDField` (Primary Key)
- `name`: `CharField` (To'liq ism)
- `username`: `CharField` (Unique)
- `email`: `EmailField` (Unique)
- `avatar`: `ImageField` (null=True)
- `role`: `CharField` (choices: `student`, `curator`, `admin`)
- `status`: `CharField` (choices: `active`, `inactive`, `pending`)
- `field`: `CharField` (Mutaxassislik sohasi)
- `long_bio`: `TextField` (Batafsil ma'lumot)
- `field_description`: `TextField` (Soha tavsifi)
- `motivation_quote`: `CharField` (Motivatsion iqtibos)
- `skills`: `JSONField` (Ko'nikmalar ro'yxati - `string[]`)
- `assigned_curator`: `ForeignKey('self', null=True, on_delete=SET_NULL)` (O'quvchi uchun kurator)
- `is_approved`: `BooleanField` (Kuratorlar uchun admin tasdig'i)
- `created_at`: `DateTimeField` (auto_now_add=True)

### 3.2. `SocialLink` (Ijtimoiy tarmoq havolalari)
- `user`: `ForeignKey(User, related_name='social_links')`
- `icon_url`: `URLField` (Ikonka manzili)
- `link_url`: `URLField` (Profil manzili)

### 3.3. `Season` (Mavsum)
- `id`: `UUIDField` (Primary Key)
- `number`: `IntegerField` (Unique)
- `start_date`: `DateField`
- `is_active`: `BooleanField`
- `duration_months`: `IntegerField` (null=True)

### 3.4. `StudentProgress` (Monitoring)
- `id`: `UUIDField` (Primary Key)
- `curator`: `ForeignKey(User)`
- `season`: `ForeignKey(Season)`
- `week_number`: `IntegerField`
- `student_name`: `CharField` (O'quvchi ismi)
- `weekly_goal`: `TextField`
- `difficulty`: `TextField`
- `solution`: `TextField`
- `status`: `CharField` (choices: `Bajarilmoqda`, `Hal qilindi`, `Kutilmoqda`, `Bajarmadi`)
- `meeting_day`: `DateTimeField` (Uchrashuv vaqti)
- `attended`: `BooleanField` (default=True)

### 3.5. `WeeklyHighlight` (Uchrashuvdan lavhalar)
- `id`: `UUIDField` (Primary Key)
- `curator`: `ForeignKey(User)`
- `season`: `ForeignKey(Season)`
- `week_number`: `IntegerField`
- `photo_url`: `URLField` yoki `ImageField`
- `uploaded_by`: `CharField` (Yuklovchi ismi)

### 3.6. `Notification` (Bildirishnomalar)
- `id`: `UUIDField` (Primary Key)
- `title`: `CharField`
- `message`: `TextField`
- `type`: `CharField` (choices: `info`, `warning`, `success`, `urgent`)
- `timestamp`: `DateTimeField` (auto_now_add=True)
- `is_read`: `BooleanField` (default=False)
- `target_role`: `CharField` (choices: `all`, `student`, `curator`)
- `target_user`: `ForeignKey(User, null=True, blank=True)` (Ma'lum bir foydalanuvchi uchun)
- `sender`: `CharField` (Yuboruvchi nomi)

### 3.6. `ChatMessage` (Chat xabarlari)
- `id`: `UUIDField` (Primary Key)
- `user`: `ForeignKey(User, null=True)` (Agar tizim xabari bo'lmasa)
- `role`: `CharField` (choices: `user`, `model`)
- `text`: `TextField`
- `timestamp`: `DateTimeField` (auto_now_add=True)

### 3.7. `PlatformSetting` (Platforma sozlamalari)
- `key`: `CharField` (Unique - e.g., `is_registration_open`, `active_season_id`)
- `value`: `TextField`
- `description`: `CharField` (null=True)

---

## 4. API Endpoints (RESTful)

### 4.1. Autentifikatsiya (Authentication)
- `POST /api/auth/login/` — JWT token olish.
- `POST /api/auth/register/` — Ro'yxatdan o'tish (Student/Curator).
- `GET /api/auth/me/` — Joriy foydalanuvchi ma'lumotlari.

### 4.2. Monitoring (Progress)
- `GET /api/monitoring/` — Monitoring yozuvlari ro'yxati (Filtrlar: `season`, `week`, `curator`).
- `POST /api/monitoring/` — Yangi progress kiritish (Curator).
- `PATCH /api/monitoring/{id}/` — Progressni tahrirlash.

### 4.3. Lavhalar (Highlights)
- `GET /api/highlights/` — Rasmlar galereyasi.
- `POST /api/highlights/` — Rasm yuklash (Curator).
- `DELETE /api/highlights/{id}/` — Rasmni o'chirish.

### 4.4. Mavsumlar va Sozlamalar
- `GET /api/seasons/` — Barcha mavsumlar.
- `POST /api/seasons/` — Yangi mavsum yaratish (Admin).
- `PATCH /api/seasons/{id}/` — Mavsumni tahrirlash yoki arxivlash (Admin).
- `GET /api/settings/` — Platforma sozlamalari (Registration holati, xabarnoma sozlamalari).
- `PATCH /api/settings/{key}/` — Sozlamani o'zgartirish (Admin).

### 4.5. AI Chat va Xabarlar
- `GET /api/chat/history/` — Foydalanuvchining chat tarixi.
- `POST /api/chat/send/` — AI Buddy'ga xabar yuborish va javob olish.

### 4.6. Admin Analitika va Boshqaruv
- `GET /api/admin/stats/` — Dashboard uchun batafsil analitika (Charts: Line, Bar, Pie).
- `GET /api/admin/monitoring/export/` — Monitoring ma'lumotlarini Excel (XLSX) formatida yuklab olish uchun ma'lumotlar.
- `POST /api/admin/notifications/send/` — Global, rolga asoslangan yoki ma'lum bir foydalanuvchiga (Direct Message) bildirishnoma yuborish.
- `PATCH /api/admin/users/{id}/role/` — Foydalanuvchi rolini o'zgartirish.
- `PATCH /api/admin/users/{id}/status/` — Foydalanuvchi statusini o'zgartirish (Active/Inactive/Pending).
- `POST /api/admin/users/{id}/approve/` — Kuratorlik so'rovini tasdiqlash.

---

## 5. Texnik talablar (Technical Stack)
- **Framework:** Django 5.x + Django Rest Framework (DRF).
- **Database:** PostgreSQL.
- **Auth:** `djangorestframework-simplejwt`.
- **Media Storage:** AWS S3 yoki Cloudinary (Rasmlar uchun).
- **Task Queue:** Celery + Redis (Haftalik hisobotlar va avtomatik yozuvlar yaratish uchun).
- **CORS:** `django-cors-headers`.

---

## 6. Biznes mantiq qoidalari (Business Logic)
1. **Kurator tasdig'i:** Ro'yxatdan o'tgan kuratorlar `is_approved=True` bo'lmaguncha monitoring kiritolmaydi.
2. **Haftalik avtomatlashtirish:** Har dushanba kuni barcha faol o'quvchilar uchun yangi haftalik "Kutilmoqda" holatidagi yozuvlar avtomatik yaratiladi (Celery task).
3. **Mavsum izolatsiyasi:** Bir mavsumdagi ma'lumotlar boshqasiga ta'sir qilmaydi.
4. **Davomat:** Agar `attended=False` bo'lsa, status avtomatik ravishda "Bajarmadi" ga o'zgarishi mumkin.

---

## 7. Xavfsizlik va samaradorlik (Security & Performance)
- **Rate Limiting:** API so'rovlar sonini cheklash.
- **Indexing:** `student_id`, `curator_id`, `season_id` va `week_number` maydonlariga DB indekslari.
- **Validation:** Serializer darajasida qat'iy ma'lumotlar validatsiyasi.
- **Permissions:** Har bir endpoint uchun `IsAuthenticated` va rollarga asoslangan ruxsatnomalar.
