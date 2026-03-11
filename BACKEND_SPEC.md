# Buddy Team Backend Technical Specification

## 1. Project Overview
The Buddy Team backend provides the core logic and data persistence for the Buddy Team platform. It handles user authentication, role-based access control (Admin, Curator, Student), weekly monitoring data, gallery management, and notifications.

## 2. Technology Stack
- **Framework**: Django 5.x + Django REST Framework (DRF)
- **Database**: PostgreSQL
- **Authentication**: JWT (Simple JWT)
- **File Storage**: Local Storage / Cloudinary (for avatars and highlights)
- **API Documentation**: Swagger/ReDoc (drf-spectacular)

## 3. Database Schema

### 3.1. User Model (Custom)
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| username | String | Unique username |
| email | Email | Unique email |
| full_name | String | User's full name |
| role | Enum | 'admin', 'curator', 'student' |
| status | Enum | 'active', 'inactive', 'pending' |
| avatar | URL/File | User profile picture |
| field | String | Specialization (e.g., 'Frontend') |
| bio | Text | User's long biography |
| field_desc| Text | Description of expertise |
| quote | String | Motivation quote |
| is_approved| Boolean | Approval status for curators/students |
| curator | ForeignKey | Assigned curator (if user is student) |

### 3.2. SocialLink Model
| Field | Type | Description |
|-------|------|-------------|
| user | ForeignKey | Reference to User |
| platform | String | e.g., 'Instagram', 'Telegram' |
| url | URL | Profile link |

### 3.3. Season Model
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| number | Integer | Season sequence number |
| start_date| Date | Commencement date |
| duration | Integer | Duration in months |
| is_active | Boolean | Currently active season |

### 3.4. Monitoring Model (StudentProgress)
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| student | ForeignKey | Reference to Student |
| curator | ForeignKey | Reference to Curator |
| season | ForeignKey | Reference to Season |
| week_number| Integer | Week of the season|
| goal | Text | Weekly goal |
| difficulty| Text | Challenges faced |
| solution | Text | Proposed solution |
| status | Enum | 'Bajarilmoqda', 'Hal qilindi', etc. |
| meeting_day| DateTime | Weekly meeting time |
| attended | Boolean | Attendance status |

### 3.5. WeeklyHighlight Model
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| curator | ForeignKey | Uploader |
| season | ForeignKey | Reference to Season |
| week_number| Integer | Week index |
| image | File | Highlight photo |

### 3.6. Notification Model
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| title | String | Notification summary |
| message | Text | Detailed content |
| type | Enum | 'info', 'success', 'warning' |
| is_read | Boolean | Read status |
| recipient | ForeignKey | targeted user (optional) |
| target_role| Enum | targeted role (optional) |

## 4. API Endpoints

### 4.1. Authentication
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - JWT Login
- `POST /api/auth/token/refresh/` - Token rotation

### 4.2. User Management
- `GET /api/users/profile/` - Get current user profile
- `PATCH /api/users/profile/` - Update profile data
- `GET /api/users/curators/` - List active curators
- `POST /api/users/assign/` - Assign student to curator (Student action)

### 4.3. Monitoring & Progress
- `GET /api/monitoring/` - List reports (Filtered by role/season)
- `POST /api/monitoring/` - Submit weekly report
- `PATCH /api/monitoring/{id}/` - Update report (Curator/Admin)

### 4.4. Gallery & Seasons
- `GET /api/highlights/` - View weekly moments
- `POST /api/highlights/` - Upload new highlight (Curator)
- `GET /api/seasons/` - List all seasons
- `POST /api/seasons/` - Create new season (Admin)

### 4.5. Admin Operations
- `GET /api/admin/stats/` - Analytics summary
- `PATCH /api/admin/users/{id}/approve/` - Approve new curators
- `POST /api/admin/notifications/broadcast/` - Send global notifications

## 5. Security & Constraints
- Role-based permissions (IsAdmin, IsCurator, IsStudent).
- Only assigned curators can edit their students' progress.
- Admins have global read/write access.
- Secure file handling for uploads.
