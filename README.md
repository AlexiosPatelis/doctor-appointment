

# Doctor Appointment Booking System

### A full-stack appointment booking platform with authentication, calendar scheduling, and admin management.
- **Backend**: Node.js + Express + MongoDB (Mongoose)
- **Frontend**: React (Vite) + React Big Calendar
- **Authentication**: JWT με httpOnly cookies
- **Dockerized**: MongoDB, API, Frontend (Nginx)

---

## Features
- Δημιουργία slots (admin only)
- Εμφάνιση διαθέσιμων slots σε calendar view
- Booking από ασθενή (με reference code)
- Ακύρωση από ασθενή (με reference + contact)
- Admin panel για διαχείριση slots/appointments
- Authentication με ρόλους (patient / admin)

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

## Local Development (χωρίς Docker)

### 1. Clone το repo

- git clone https://github.com/AlexiosPatelis/doctor-appointment.git
- cd doctor-appointment

### 2. Setup MongoDB

Πρέπει να τρέχει MongoDB local (π.χ. mongodb://localhost:27017/doctor).

### 3. Backend

- cd doctor-appointment-backend
- cp .env.example .env   # αν υπάρχει, αλλιώς δημιούργησε .env με MONGO_URI, JWT_SECRET, PORT
- npm install
- npm run dev
- Backend διαθέσιμο στο http://localhost:5000

### 4. Frontend

- cd ../doctor-appointment-frontend
- cp .env.example .env   # περιέχει VITE_API_BASE=http://localhost:5000
- npm install
- npm run dev
- Frontend διαθέσιμο στο http://localhost:5173

##  Docker Deployment

### 1. Build & Run
docker-compose up --build

### 2. Services

- MongoDB → localhost:27017
- Backend (Express API) → http://localhost:5000
- Frontend (React via Nginx) → http://localhost:8080

# Admin User Creation

## Για να δημιουργήσεις admin:

- cd doctor-appointment-backend
- docker-compose exec backend node scripts/makeAdmin.js adminUsername adminPassword
- Μετά μπορείς να κάνεις login στο frontend με αυτά τα credentials.

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
- Οι patients δημιουργούνται μόνο μέσω /auth/register.
- Μόνο admin μπορεί να δημιουργεί slots και να βλέπει όλα τα ραντεβού.
- Οι ασθενείς χρειάζονται reference code + contact για να ακυρώσουν.


# **Aναλυτικά:**

## *Tech Stack & Αρχιτεκτονική*

### Backend: Express, Mongoose, JWT, bcrypt, Helmet, CORS


- Backend (Express, Mongoose, JWT, bcrypt, Helmet, CORS)
  
- Express: Web framework για REST API. Ορίζει routes όπως /auth/*, /appointments/*, εφαρμόζει middleware (auth, error handling).
  
- Mongoose: ODM για MongoDB. Ορίζει τα σχήματα/μοντέλα (π.χ. User, Slot, Appointment), validations, indexes και δίνει atomic operations (π.χ. findOneAndUpdate).
  
- JWT: Έκδοση και επαλήθευση tokens για authentication. Το token μπαίνει σε httpOnly cookie (προστασία από XSS) και χρησιμοποιείται από το middleware για να “δεί” τον χρήστη (req.user).
  
- bcrypt: Hashing κωδικών χρηστών πριν αποθήκευση. Ποτέ plain-text passwords.
  
- Helmet: Security headers (Content-Security-Policy, X-Frame-Options, κ.λπ.)—μειώνει επιφάνεια επίθεσης.
  
- CORS: Επιτρέπει στο frontend origin (π.χ. http://localhost:8080) να μιλά με το backend, με credentials: true για να στέλνει το cookie.

*Ρόλοι & Ροές*

- Users: patient (default) & admin.

#### Auth flow:
- POST /auth/login → αν τα credentials είναι σωστά, εκδίδεται JWT και μπαίνει σε httpOnly cookie.
- GET /auth/me → ο server διαβάζει το JWT από το cookie, επιστρέφει { id, username, role }.
- POST /auth/refresh → ανανέωση cookie αν το JWT είναι ακόμη έγκυρο/μη ληγμένο (ή λίγο πριν λήξει).
- POST /auth/logout → καθαρίζει το cookie.

#### Appointments:

- Slots (admin): δημιουργία διαθέσιμων χρονικών παραθύρων (start/end/doctor/status).
- Booking (patient): POST /appointments/book με slotId, στοιχεία ασθενή και προαιρετικό reason. Επιστρέφει reference code.
- Cancel (public): POST /appointments/cancel με reference + contact.
- Admin list/cancel: GET /appointments/all, DELETE /appointments/:id.

***Στόχος robustness: το booking πρέπει να είναι atomic (να “κλειδώνει” το slot).***
- Μοντέλο Slot με status available|booked|cancelled.
- Atomic update: findOneAndUpdate({ _id: slotId, status: 'available' }, { $set: { status: 'booked' } }). Αν γυρίσει null, κάποιος άλλος το “πήρε”.
- Εναλλακτικά, unique index σε (slotId, activeBooking) ή χρήση session/transaction (Mongo replica set).

#### Ασφάλεια

- Cookie ρυθμίσεις: σε παραγωγή secure: true και sameSite: 'none' (πίσω από HTTPS). Σε dev, secure: false, sameSite: 'lax'.
- Περιορισμός CORS σε συγκεκριμένο origin (όχι *) και credentials: true.
- Mongo auth: Στο dev είναι συχνά ανοιχτό (είδες το warning “Access control is not enabled”). Σε prod ενεργοποίησε root χρήστη και χρησιμοποίησε mongodb://user:pass@mongo:27017/doctor.

  
 ###  Frontend (React, Vite, React Router, React Big Calendar) (https://github.com/jquense/react-big-calendar)
- React (Vite): SPA με γρήγορο dev server & build. Το Vite inject-άρει μεταβλητές από .env με prefix VITE_ (π.χ. VITE_API_BASE).
- React Router: Client-side routing (σελίδες: Calendar /, Cancel /cancel, Admin /admin, Login/Signup).
- React Big Calendar: Προβολές Day/Week/Month, events από τα slots του backend. Χρωματίζει:
- Πράσινο: διαθέσιμο
- Κόκκινο: κλεισμένο
- Γκρι: παρελθόν
- date-fns: Formatting/υπολογισμοί ημερομηνιών.
- Axios: Κοινό instance με baseURL = VITE_API_BASE, withCredentials: true για cookies, response interceptor:
- Αν πάρει 401, κάνει POST /auth/refresh. Έχει ουρά (queue) ώστε πολλά αιτήματα που αποτυγχάνουν ταυτόχρονα να περιμένουν ένα refresh.

#### *Frontend state & UX*

- AuthContext: Κρατά τρέχοντα χρήστη (role) και χειρίζεται login/logout/me/refresh.
- Home: Φορτώνει slots στη range του calendar. On click διαθέσιμου slot → InlineBookingModal:
- Στέλνει POST /appointments/book, εμφανίζει reference code και παρέχει copy + deep link στη σελίδα cancel.
- Cancel: Φόρμα με reference + contact. Δείχνει επιτυχία/σφάλμα.
- Admin: Προσθήκη slots, λίστα/ακύρωση ραντεβού, refresh.

### Database (MongoDB)

#### *Collections:*
- users: { username, passwordHash, role }
- slots: { start, end, doctor, status } με indexes σε { start, end, status } για γρήγορο εύρος ημερομηνιών.
- appointments: { slotId, patientName, contact, reference, status } με index στο reference.

### Containerization (Docker + Docker Compose)

#### 3 services:

- mongo: με volume mongo_data στο /data/db.
- backend: Node/Express, διαβάζει .env (π.χ. MONGO_URI=mongodb://mongo:27017/doctor).
- frontend: Build React → serve με nginx. Το VITE_API_BASE δίνεται στο build time μέσω build.args.

#### Networking:

- Όλα τα services είναι στο ίδιο Docker network → μπορούν να μιλάνε με DNS name mongo, backend.
- Tο frontend μιλά απευθείας στο backend μέσω http://localhost:5000 (εξωτερικό port mapping) H εναλλακτικά Nginx proxy σε /api/* → http://backend:5000 για ένα origin (frontend+api στο 8080), οπότε δεν χρειάζεται CORS.

# Αρχιτεκτονικό Διάγραμμα (2 κοινές παραλλαγές)
## A) χωρίς proxy
[Browser]
   |  http://localhost:8080
   v
[Nginx (frontend) serves React build]
   |
   |  API calls → http://localhost:5000
   v
[Express API (backend)] --(Mongoose)--> [MongoDB]


- Pro: πιο απλό.
- Con: CORS απαραίτητο (δύο origins: 8080 & 5000).

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


- Pro: ένα origin (8080). Πιο “καθαρό” σε prod, χωρίς CORS.
- Con: Θέλει σωστό nginx.conf + στο build VITE_API_BASE=/api.

## Ροές χρήσης (sequence)
### Login

- Frontend → POST /auth/login (axios με withCredentials).
- Backend εκδίδει JWT, το βάζει σε httpOnly cookie.
- Frontend κάνει GET /auth/me για να πάρει { username, role } και να ρυθμίσει UI (π.χ. εμφάνιση Admin menu).

### Booking
- Χρήστης επιλέγει διαθέσιμο slot → ανοίγει modal.
- POST /appointments/book με slotId, στοιχεία ασθενή.
- Backend κάνει atomic update στο slot → δημιουργεί appointment → επιστρέφει reference code.
- Frontend εμφανίζει code + κουμπί Copy + link για /cancel.

### Cancel
- Χρήστης βάζει reference + contact.
- POST /appointments/cancel.
- Αν ταιριάζει → ακυρώνει appointment και “ελευθερώνει”/μαρκάρει το slot ανάλογα με στρατηγική σου.

---

### Aν θελήσεις να τρέξεις το project:

1. `git clone`  
2. `docker-compose up --build`  
3. Άνοιξε το **http://localhost:8080** (frontend)  
4. Backend → http://localhost:5000, DB → http://localhost:27017  

---


### Εντολές για Update στο GitHub

- repo https://github.com/AlexiosPatelis/doctor-appointment:


- cd doctor-appointment

- git status

*Πρόσθεσε όλα τα νέα/αλλαγμένα αρχεία*
- git add .

*Κάνε commit με περιγραφή*
- git commit -m "Update backend/frontend with Docker setup, Magic Bento UI"

*Στείλε τα commits στο GitHub*
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



