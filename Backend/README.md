# 🏨 Smart Hostel System — Spring Boot

A full-featured hostel management REST API built with Spring Boot 3.2, covering 5 modules:
Student Registration, Room Booking, Fee & Payment, Complaints, and Digital Gatepass with QR code.

---

## 🚀 Quick Start

### Prerequisites
- Java 17+
- Maven 3.8+
- MySQL 8.0

### 1. Clone and configure

```bash
git clone <repo-url>
cd smart-hostel
```

Edit `src/main/resources/application.yml` with your DB credentials.

### 2. Run locally

```bash
mvn spring-boot:run
```

### 3. Run with Docker

```bash
docker-compose up --build
```

---

## 🔐 Default Credentials (auto-seeded on startup)

| Role     | Email                  | Password      |
|----------|------------------------|---------------|
| ADMIN    | admin@hostel.com       | Admin@123     |
| WARDEN   | warden@hostel.com      | Warden@123    |
| SECURITY | security@hostel.com    | Security@123  |

> Students get email as username and their `studentId` as default password.

---

## 📡 API Base URL

```
http://localhost:8080/api/v1
```

### Swagger UI
```
http://localhost:8080/swagger-ui.html
```

---

## 📦 Modules & Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/login | Get JWT token |
| POST | /auth/refresh | Refresh token |
| POST | /auth/change-password | Change password |

### Students
| Method | Path | Role |
|--------|------|------|
| POST | /students | WARDEN/ADMIN |
| GET | /students | WARDEN/ADMIN |
| GET | /students/{id} | WARDEN/ADMIN/STUDENT(own) |
| PUT | /students/{id} | WARDEN/ADMIN |
| DELETE | /students/{id} | ADMIN |

### Rooms & Bookings
| Method | Path | Role |
|--------|------|------|
| POST | /rooms | ADMIN |
| GET | /rooms | WARDEN/ADMIN |
| GET | /rooms/available | WARDEN/ADMIN |
| GET | /rooms/occupancy | WARDEN/ADMIN |
| POST | /bookings | WARDEN/ADMIN |
| PATCH | /bookings/{id}/checkout | WARDEN/ADMIN |

### Fees & Payments
| Method | Path | Role |
|--------|------|------|
| GET | /fees | WARDEN/ADMIN |
| GET | /fees/student/{id} | WARDEN/ADMIN |
| GET | /fees/my-fees | STUDENT |
| GET | /fees/overdue | WARDEN/ADMIN |
| POST | /fees/payment | WARDEN/ADMIN |
| POST | /fees/generate-monthly | ADMIN |

### Complaints
| Method | Path | Role |
|--------|------|------|
| POST | /complaints | STUDENT |
| GET | /complaints | WARDEN/ADMIN |
| GET | /complaints/my-complaints | STUDENT |
| PUT | /complaints/{id}/assign | WARDEN/ADMIN |
| PATCH | /complaints/{id}/status | WARDEN/ADMIN |
| PATCH | /complaints/{id}/resolve | WARDEN/ADMIN |

### Gatepass (QR)
| Method | Path | Role |
|--------|------|------|
| POST | /gatepasses | STUDENT |
| GET | /gatepasses | WARDEN/ADMIN |
| GET | /gatepasses/pending | WARDEN/ADMIN |
| GET | /gatepasses/my-gatepasses | STUDENT |
| PUT | /gatepasses/{id}/approve | WARDEN |
| PUT | /gatepasses/{id}/reject | WARDEN |
| GET | /gatepasses/{id}/qr | STUDENT (returns PNG image) |
| POST | /gatepasses/scan?qrContent=... | SECURITY |

---

## 🔐 Gatepass QR Flow

1. Student submits request → status: `PENDING`
2. Warden approves → QR PNG generated (ZXing), token stored, status: `APPROVED`
3. Student fetches `/gatepasses/{id}/qr` → shows QR image in app
4. Security guard scans QR at gate → `/gatepasses/scan?qrContent=...`
   - 1st scan → logs EXIT time
   - 2nd scan → logs ENTRY time, status: `USED`
5. QR auto-expires after 12 hours (configurable)

---

## ⚙️ Configuration

Key properties in `application.yml`:

```yaml
app:
  jwt:
    secret: <256-bit base64 secret>
    expiration: 86400000        # 24h in ms
    refresh-expiration: 604800000 # 7d in ms
  gatepass:
    qr-expiry-hours: 12
```

---

## 🏗️ Project Structure

```
src/main/java/com/hostel/
├── SmartHostelApplication.java
├── config/
│   ├── SecurityConfig.java
│   ├── OpenApiConfig.java
│   ├── StudentSecurity.java
│   └── DataSeeder.java
├── module/
│   ├── auth/         (AppUser, JwtUtil, JwtAuthFilter, AuthService, AuthController)
│   ├── student/      (Student, StudentService, StudentController)
│   ├── room/         (Room, Booking, RoomService, RoomController)
│   ├── fee/          (FeeRecord, Payment, FeeService, FeeController)
│   ├── complaint/    (Complaint, ComplaintController)
│   └── gatepass/     (Gatepass, QRCodeService, GatepassService, GatepassController)
└── shared/
    ├── dto/ApiResponse.java
    ├── enums/
    └── exception/
```
