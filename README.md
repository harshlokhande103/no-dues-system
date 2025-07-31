# No Dues System

A comprehensive online No Dues management system for colleges, built with Node.js, Express, EJS, and Firebase Firestore.

## Features

### 🎯 Core Functionality
- **Multi-role Authentication**: Student, Teacher, and Admin roles
- **Online Approvals**: Teachers can approve/reject student dues online
- **Real-time Status Updates**: Students can view their approval status in real-time
- **Branch-wise Management**: Separate data management for different college branches
- **Notification System**: Admin can send notifications to all users

### 👥 User Roles

#### Student
- Register and login with branch, year, and section details
- View approval status from all teachers
- Download no dues certificate
- Receive notifications from admin

#### Teacher
- Register with multiple branch, year, and section access
- Filter students by year and section
- Approve or reject student dues
- Update approval status in real-time
- View notifications from admin

#### Admin
- Manage all students and teachers in their branch
- Send notifications to all users
- Filter and view student data
- Delete student/teacher records
- View approval status of all students

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js
- **Frontend**: EJS (Embedded JavaScript), HTML, CSS, JavaScript
- **Database**: Firebase Firestore
- **Authentication**: Session-based authentication
- **Deployment**: Render.com

## 📁 Project Structure

```
no-dues-system/
├── app.js                 # Main application file
├── package.json           # Dependencies and scripts
├── .gitignore            # Git ignore rules
├── README.md             # Project documentation
├── views/                # EJS templates
│   ├── index.ejs         # Landing page
│   ├── role.ejs          # Role selection
│   ├── studentLogin.ejs  # Student login
│   ├── teacherLogin.ejs  # Teacher login
│   ├── adminLogin.ejs    # Admin login
│   ├── studentRegister.ejs
│   ├── teacherRegister.ejs
│   ├── adminRegister.ejs
│   ├── studentDashboard.ejs
│   ├── teacherDashboard.ejs
│   ├── adminDashboard.ejs
│   ├── teacherFilter.ejs
│   └── filter.ejs
├── public/               # Static files
│   └── css/
│       └── style.css
├── config/               # Configuration files
│   └── firebase.js
└── routes/               # Route modules
    ├── admin.js
    ├── authRoutes.js
    ├── studentRoutes.js
    └── teacherRoutes.js
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Firebase account

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/harshlokhande103/no-dues-system.git
   cd no-dues-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Firebase Setup**
   - Create a Firebase project
   - Enable Firestore Database
   - Download your Firebase config file
   - Update `config/firebase.js` with your Firebase credentials

4. **Start the server**
   ```bash
   npm start
   ```

5. **Access the application**
   - Open your browser and go to `http://localhost:3000`

### Deployment on Render

1. **Connect your GitHub repository to Render**
2. **Configure the service**:
   - Build Command: `npm install`
   - Start Command: `node app.js`
   - Environment: Node.js

## 📊 Database Structure

### Firestore Collections

```
branches/
├── {branchName}/
│   ├── students/
│   │   └── {studentId}/
│   │       ├── approvals/
│   │       │   └── {approvalId}
│   │       └── studentData
│   ├── teachers/
│   │   └── {teacherId}
│   └── admins/
│       └── {adminId}
└── notifications/
    └── {notificationId}
```

## 🔧 Configuration

### Environment Variables
- `PORT`: Server port (default: 3000)
- Firebase configuration in `config/firebase.js`

### Firebase Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // For development
    }
  }
}
```

## 🎨 Features in Detail

### Student Dashboard
- View approval status from all teachers
- Real-time status updates
- Download no dues certificate
- View notifications

### Teacher Dashboard
- Filter students by year and section
- Approve/reject student dues
- Real-time status updates
- View notifications

### Admin Dashboard
- Send notifications to all users
- Filter and view student data
- Delete student/teacher records
- View approval status of all students

## 🔒 Security Features

- Session-based authentication
- Role-based access control
- Input validation and sanitization
- Secure password handling

## 🚀 Deployment

The application is deployed on Render.com and can be accessed at:
[https://noo-dues-system.onrender.com](https://noo-dues-system.onrender.com)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Harsh Lokhande**
- GitHub: [@harshlokhande103](https://github.com/harshlokhande103)

## 🙏 Acknowledgments

- Firebase for the database service
- Express.js community for the web framework
- Render.com for hosting services

---

**Note**: This is a college project for managing no dues certificates online. For production use, please implement additional security measures and proper error handling. 