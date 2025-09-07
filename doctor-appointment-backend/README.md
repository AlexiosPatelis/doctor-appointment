# Doctor Appointment Backend

This is the backend service for the **Doctor Appointment Booking System**.  
It provides a REST API to manage users, appointment slots, and bookings.

---

## 🚀 Tech Stack
- **Node.js** + **Express.js**
- **MongoDB** (via Mongoose)
- **JWT Authentication**
- **bcrypt.js** for password hashing
- **helmet** & **express-rate-limit** for security
- **nodemon** for development

---

## ⚙️ Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/AlexiosPatelis/doctor-appointment-backend.git
cd doctor-appointment-backend
2. Install dependencies

npm install
3. Environment Variables
Create a .env file in the project root:


PORT=5000
MONGO_URI=mongodb://localhost:27017/doctor_appointments
JWT_SECRET=your_secret_key
4. Run the server
Development (auto-restart):


npm run dev
Production:


npm start
📡 API Endpoints
Auth
POST /auth/register → register new user (admin or patient)

POST /auth/login → login and get JWT token

Appointments (Patient)
GET /appointments/available → list available slots

POST /appointments/book → book a slot (requires patient token)

Appointments (Admin)
GET /appointments/all → list all appointments (requires admin token)

POST /appointments/slots → add new slot (requires admin token)

DELETE /appointments/:id → cancel appointment (requires admin token)

🧪 Testing with Postman
Register an admin and a patient user

Login to get JWT token

Use the token in Authorization: Bearer <token>

Try the booking flow:

Admin: add slot

Patient: book slot

Admin: view/cancel bookings

📌 Notes
Passwords are hashed before saving.

JWT tokens expire in 1h (can be refreshed later).

Security middleware (helmet, rate-limiter, CORS) included.

📜 License
MIT

yaml


---

👉 steps to add & push this:

```powershell
echo "# Doctor Appointment Backend" > README.md
# (instead paste the full content above into README.md manually in VSCode or Notepad++)

git add README.md
git commit -m "Add README with setup instructions and API docs"
git push
