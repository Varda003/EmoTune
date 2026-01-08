# 🎵 EmoTune – Emotion-Based Music Recommendation System

EmoTune is a full-stack web application that recommends music based on a user’s **facial emotion**. It uses a **CNN-based emotion detection model** integrated with a **React frontend** and **Flask backend**, providing personalized music recommendations, user profiles, and listening statistics.

---
## 🎥 Demo Video

👉 **Demo Video:**  
(Add your video link here)  

---

## 🖼️ Screenshots

### Login & Authentication
![Login Page](screenshots/login.png)

### Emotion Detection
![Emotion Detection](screenshots/emotion-detection.png)

### Music Recommendations
![Music Recommendations](screenshots/recommendations.png)

### User Profile & Stats
![User Profile](screenshots/profile.png)

*(Create a `screenshots/` folder and add your images there)*

---

## 🚀 Project Overview

EmoTune captures a user’s facial expression, identifies their emotional state (such as happy, sad, neutral, etc.), and recommends songs that match the detected mood. The system also supports user authentication, profile management, liked songs, and usage statistics for a personalized experience.

---

## 🧠 Key Features

- Real-time **facial emotion detection** using a CNN model  
- **Emotion-based music recommendations**
- Secure authentication (Email/Password + Google OAuth)
- Personalized user profiles with statistics & streaks
- Like / Unlike songs and track listening history
- Responsive UI built with React
- REST APIs powered by Flask

---

## 🛠️ Tech Stack

### Frontend
- React.js  
- JavaScript, HTML, CSS  

### Backend
- Flask (Python)
- Flask-JWT-Extended (Authentication)
- Flask-Dance (Google OAuth)
- Flask-Mail (Password reset)

### AI / ML
- Convolutional Neural Network (CNN)
- OpenCV
- NumPy, TensorFlow / Keras

### Database
- SQL-based database (user data, statistics, liked songs)

---

## 📊 Model Performance

- Emotion detection accuracy: **~84%**
- Optimized preprocessing for improved performance in varied lighting conditions
- Trained and tested on labeled facial emotion datasets

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/your-username/emotune.git
cd emotune
```
```
cd backend
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```
### 2️⃣ Create .env file
```bash
SECRET_KEY=your_secret_key
JWT_SECRET_KEY=your_jwt_secret
MAIL_USERNAME=your_email
MAIL_PASSWORD=your_app_password
```
### 3️⃣ Run Backend
```bash
python app.py
```
### 4️⃣ Frontend Setup
``` bash
cd frontend
npm install
npm start
```
### 5️⃣ Frontend Runs on
``` bash
http://localhost:3000
```
### 6️⃣ Run Backend
```bash
http://localhost:5000
```

## 🔮 Future Enhancements

* Support for voice-based emotion detection
* Multi-language song recommendations
* Mobile application version
* Improved model accuracy with larger datasets

## 🤝 Acknowledgements

I would like to thank my mentors and team members for their guidance and support throughout the development of EmoTune. This project helped me strengthen my skills in AI, full-stack development, and system integration.

## 📬 Contact

* Developer: Varda Hanwant
* 📧 Email: varda.hanwant03@gmail.com
* 🔗 GitHub: (https://github.com/Varda003)

