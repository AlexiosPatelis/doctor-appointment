

# Doctor Appointment Booking System

### A full-stack appointment booking platform with authentication, calendar scheduling, and admin management.
- **Backend**: Node.js + Express + MongoDB (Mongoose)
- **Frontend**: React (Vite) + React Big Calendar
- **Authentication**: JWT με httpOnly cookies
- **Dockerized**: MongoDB, API, Frontend (Nginx)

---

## Features
- Creation of slots (admin only)
- Display of available slots in calendar view
- Booking by patient (with reference code)
- Cancellation by patient (with reference + contact)
- Admin panel for managing slots/appointments
- Authentication with roles (patient / admin)

---

## API Reference

### Authentication
| Method | Endpoint         | Role    | Description |
|--------|------------------|---------|-------------|
| POST   | `/auth/register` | Public  | Register new user (always patient) |
| POST   | `/auth/login`    | Public  | Login, returns JWT (httpOnly cookie) |
| POST   | `/auth/refresh`  | Public  | Refresh JWT if valid |
| GET    | `/auth/me`       | Auth    | Get current logged-in user |
| POST   | `/auth/logout`   | Auth    | Logout (clear cookie) |

---

### Appointments
| Method | Endpoint                  | Role     | Description |
|--------|---------------------------|----------|-------------|
| GET    | `/appointments/available` | Public   | List only available slots |
| GET    | `/appointments/slots`     | Public   | List all slots (available, booked, cancelled) |
| POST   | `/appointments/book`      | Patient  | Book a slot |
| POST   | `/appointments/cancel`    | Public   | Cancel by reference + contact |
| GET    | `/appointments/all`       | Admin    | List all appointments |
| DELETE | `/appointments/:id`       | Admin    | Cancel appointment by ID |
| POST   | `/appointments/slots`     | Admin    | Add new slot |

---

## Local Development (no Docker)

### 1. Clone το repo

- git clone https://github.com/AlexiosPatelis/doctor-appointment.git
- cd doctor-appointment

### 2. Setup MongoDB

MongoDB must run locally (e.g. mongodb://localhost:27017/doctor).

### 3. Backend

- cd doctor-appointment-backend
- cp .env.example .env   # if it exists, otherwise create .env με MONGO_URI, JWT_SECRET, PORT
- npm install
- npm run dev
- Backend available at http://localhost:5000

### 4. Frontend

- cd ../doctor-appointment-frontend
- cp .env.example .env   # contains VITE_API_BASE=http://localhost:5000
- npm install
- npm run dev
- Frontend available at http://localhost:5173

##  Docker Deployment

### 1. Build & Run
docker-compose up --build

### 2. Services

- MongoDB → localhost:27017
- Backend (Express API) → http://localhost:5000
- Frontend (React via Nginx) → http://localhost:8080

# Admin User Creation

## To create an admin:

- cd doctor-appointment-backend
- docker-compose exec backend node scripts/makeAdmin.js adminUsername adminPassword
- Then you can log in to the frontend with these credentials.

## Environment Variables
*Backend (doctor-appointment-backend/.env)*
- NODE_ENV=production
- PORT=5000
- MONGO_URI=mongodb://mongo:27017/doctor
- JWT_SECRET=change-me
- FRONTEND_ORIGIN=http://localhost:8080

*Frontend (doctor-appointment-frontend/.env)*
- VITE_API_BASE=http://localhost:5000

## Notes:
- atients are created only through /auth/register.
- Only admin can create slots and view all appointments.
- Patients need reference code + contact to cancel.


# **In detail:**

## *Tech Stack & Αρχιτεκτονική*

### Backend: Express, Mongoose, JWT, bcrypt, Helmet, CORS


- Backend (Express, Mongoose, JWT, bcrypt, Helmet, CORS)
  
- Express: Web framework for REST APIs. Defines routes like /auth/* and /appointments/*, and applies middleware (auth, error handling).
  
- Mongoose: ODM for MongoDB. Defines schemas/models (e.g. User, Slot, Appointment), validations, indexes, and provides atomic operations (e.g. findOneAndUpdate).
  
- JWT: Issues and verifies tokens for authentication. Token is stored in an httpOnly cookie (protection from XSS) and used by middleware to populate req.user.
  
- bcrypt: Hashes user passwords before storage. Never store plain-text passwords.
  
- Helmet: Security headers (Content-Security-Policy, X-Frame-Options, etc.), reduces attack surface.
  
- CORS: Allows the frontend origin (e.g. http://localhost:8080)to communicate with the backend, with credentials: true to send the cookie.

*Roles & Flows*

- Users: patient (default) & admin.

#### Auth flow:
- POST /auth/login → if the credentials are correct, a JWT is issued and stored in an httpOnly cookie.
- GET /auth/me → the server reads the JWT from the cookie and returns { id, username, role }.
-POST /auth/refresh → refreshes the cookie if the JWT is still valid/not expired (or about to expire).
- POST /auth/logout → clears the cookie.

#### Appointments:

- Slots (admin): creation of available time windows (start/end/doctor/status).
- Booking (patient): POST /appointments/book with slotId, patient details, and optional reason. Returns a reference code.
- Cancel (public): POST /appointments/cancel with reference + contact.
- Admin list/cancel: GET /appointments/all, DELETE /appointments/:id.

***Robustness: booking must be atomic (the slot must be “locked”).***
-Slot model with status: available | booked | cancelled.
- Atomic update: findOneAndUpdate({ _id: slotId, status: 'available' }, { $set: { status: 'booked' } }). If it returns null, someone else has already taken it.
- Alternatively, a unique index on (slotId, activeBooking) or use a session/transaction (Mongo replica set).

#### Security

- Cookie settings: in production use secure: true and sameSite: 'none' (behind HTTPS). In dev use secure: false and sameSite: 'lax'.
- Restrict CORS to a specific origin (not *) and set credentials: true.
- Mongo auth: In dev it is often open (you saw the warning “Access control is not enabled”). In prod enable a root user and use mongodb://user:pass@mongo:27017/doctor.

  
 ###  Frontend (React, Vite, React Router, React Big Calendar) (https://github.com/jquense/react-big-calendar)
- React (Vite): SPA with fast dev server and build. Vite injects variables from .env with prefix VITE_ (e.g. VITE_API_BASE).
- React Router: Client-side routing (pages: Calendar /, Cancel /cancel, Admin /admin, Login/Signup).
- React Big Calendar: Day/Week/Month views, events from backend slots. Colors:
- Green: available
- lilac: booked
- Gray: past
- date-fns: Date formatting/calculations.
- Axios: Shared instance with baseURL = VITE_API_BASE, withCredentials: true for cookies, response interceptor:
- On 401, POST /auth/refresh. Uses a queue so concurrent failed requests wait for one refresh.

#### *Frontend state & UX*

- AuthContext: Stores current user (role) and handles login/logout/me/refresh.
- Home: Loads slots for the calendar range. On click of an available slot → InlineBookingModal:
- Sends POST /appointments/book, shows reference code, and provides copy + deep link to cancel page.
- Cancel: Form with reference + contact. Shows success/error.
- Admin: Add slots, list/cancel appointments, refresh.
- 
### Database (MongoDB)

#### *Collections:*
- users: { username, passwordHash, role }
- slots: { start, end, doctor, status } with indexes on { start, end, status } for fast date-range queries.
- appointments: { slotId, patientName, contact, reference, status } with index on reference.

### Containerization (Docker + Docker Compose)

#### 3 services:

- mongo: with volume mongo_data at /data/db.
- backend: Node/Express, reads .env (e.g. MONGO_URI=mongodb://mongo:27017/doctor).
- frontend: Build React → serve with nginx. VITE_API_BASE passed at build time via build.args.

#### Networking:

- All services are on the same Docker network → they can communicate using DNS names like mongo, backend.
- Frontend talks directly to backend via http://localhost:5000
 (external port mapping)
- Alternatively, Nginx proxies /api/* → http://backend:5000
 so frontend+API share origin on 8080, removing the need for CORS.

# Architectural Diagram (2 common variants)
## A) without proxy
[Browser]
   |  http://localhost:8080
   v
[Nginx (frontend) serves React build]
   |
   |  API calls → http://localhost:5000
   v
[Express API (backend)] --(Mongoose)--> [MongoDB]


- Pro: simple
- Con: CORS required (two origins: 8080 & 5000).
  
## B) Με Nginx reverse-proxy (/api → backend)
[Browser]
   |  http://localhost:8080
   v
[Nginx (frontend)]
   |   \__ / (static)
   |
   \-- /api/* → http://backend:5000
                  |
                  \--(Mongoose)--> [MongoDB]


- Pro: single origin (8080). Cleaner in production, no CORS.
- Con: requires correct nginx.conf + in build set VITE_API_BASE=/api.

## User flows (sequence)
### Login

- Frontend → POST /auth/login (axios with withCredentials).
- Backend issues a JWT and sets it in an httpOnly cookie.
- Frontend does GET /auth/me to get { username, role } and configure the UI (e.g., show the Admin menu).

### Booking
- User selects an available slot → opens a modal.
- POST /appointments/book with slotId and patient details.
- Backend performs an atomic update on the slot → creates the appointment → returns a reference code.
- Frontend shows the code + Copy button + link to /cancel.

### Cancel
- User provides reference + contact.
- POST /appointments/cancel.
- If it matches → cancels the appointment and frees/marks the slot according to your strategy.
---

### If you want to run the project:

1. `git clone`  
2. `docker-compose up --build`  
3. OPEN **http://localhost:8080** (frontend)  
4. Backend → http://localhost:5000, DB → http://localhost:27017  

---


### Commands FOR Update στο GitHub

- repo https://github.com/AlexiosPatelis/doctor-appointment:


- cd doctor-appointment

- git status

*Add all new/modified files.*
- git add .

*Make a commit with a description.*
- git commit -m "Update backend/frontend with Docker setup, Magic Bento UI"

*Send the commits to GitHub.*
- it push origin main



### Local Development

#### Requirements
- Node.js ≥ 20
- MongoDB ≥ 6
- npm

### #Run locally (without Docker)

#### Clone repo
- git clone https://github.com/AlexiosPatelis/doctor-appointment.git
- cd doctor-appointment

#### Install backend deps
- cd doctor-appointment-backend
- npm install

#### Set env vars in .env
- MONGO_URI=mongodb://localhost:27017/doctor
- JWT_SECRET=change_me
- PORT=5000

#### Run backend
- npm run dev

#### In another terminal → frontend
- cd ../doctor-appointment-frontend
- npm install

#### Create .env with API base
- echo "VITE_API_BASE=http://localhost:5000" > .env

#### Run frontend
- npm run dev


- Backend → http://localhost:5000
- Frontend → http://localhost:5173

# Run with Docker Compose
## Build and start all services
- docker-compose up --build


- Frontend → http://localhost:8080
- Backend → http://localhost:5000
- MongoDB → localhost:27017 (with volume mongo_data)

## Useful commands
### Rebuild after changes
- docker-compose up --build

### Stop containers
- docker-compose down

### Remove containers + volumes
- docker-compose down -v

## *Production Notes*

- Set NODE_ENV=production
- Use HTTPS + secure: true cookies
- Restrict FRONTEND_ORIGIN in backend .env
- Αdd MongoDB authentication (user/pass)
- Regular backups of mongo_data

### Architecture

<pre>
[Browser] → [Frontend: React+Vite (Nginx)]
    ├── /api/* → [Backend: Express + MongoDB]
    └── /      → React SPA (Calendar, Login, Admin)
</pre>


- Backend and frontend communicate via /api proxy (Nginx).
- MongoDB runs in its own container with persistent volume.

#### *React Big Calendar*
 - for scheduling UI

#### *Magic Bento* https://www.reactbits.dev/components/magic-bento
 - for modern UI components

### **Admin Creation**
- Test that everything runs: docker ps
- If backend container is Up, then: docker exec -it doctor-backend sh
- Inside container run this script: node scripts/makeAdmin.js alexios alexios



