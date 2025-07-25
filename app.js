const express = require('express');
const path = require('path');
const app = express();
const { db } = require('./config/firebase');
const { doc, collection, query, where, getDocs, addDoc, orderBy, Timestamp } = require('firebase/firestore');
const session = require('express-session');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files (CSS, images)
app.use(express.static(path.join(__dirname, 'public')));

// Express Session Middleware
app.use(session({
  secret: 'your_secret_key', // koi bhi secret string
  resave: false,
  saveUninitialized: true
}));

app.use(express.urlencoded({ extended: true }));


app.get('/', (req, res) => {
  res.render('index'); // ya res.render('index');
});

app.get('/start', (req, res) => {
  res.render('role');
});



// Student registration
app.get('/register/student', (req, res) => {
  res.render('studentRegister');
});
app.post('/register/student', express.urlencoded({ extended: true }), async (req, res) => {
  const { name, email, enrolment, branch, year, section, password } = req.body;
  try {
    // Branch document reference
    const branchDocRef = doc(db, "branches", branch);

    await addDoc(collection(branchDocRef, "students"), {
      name,
      email,
      enrolment,
      branch,
      year,
      section,
      password
    });

    req.session.student = { name, email, enrolment, branch, year, section };
    res.redirect('/studentDashboard');
  } catch (error) {
    res.send("Error: " + error.message);
  }
});

// Teacher registration
app.get('/register/teacher', (req, res) => {
  res.render('teacherRegister');
});
app.post('/register/teacher', express.urlencoded({ extended: true }), async (req, res) => {
  let { name, email, branch, year, section, password } = req.body;
  if (!Array.isArray(branch)) branch = [branch];
  if (!Array.isArray(year)) year = [year];
  if (!Array.isArray(section)) section = [section];

  try {
    // Branch document reference
    const branchDocRef = doc(db, "branches", branch[0]); // Agar ek se zyada branch, to yahan logic lagao

    await addDoc(collection(branchDocRef, "teachers"), {
      name,
      email,
      branch,
      year,
      section,
      password
    });

    req.session.teacher = { name, email, branch, year, section };
    res.redirect('/teacherDashboard');
  } catch (error) {
    res.send("Error: " + error.message);
  }
});

// Admin registration
app.get('/register/admin', (req, res) => {
  res.render('adminRegister');
});
app.post('/register/admin', express.urlencoded({ extended: true }), async (req, res) => {
  const { name, email, branch, password } = req.body;
  try {
    // Branch document reference
    const branchDocRef = doc(db, "branches", branch);

    // Admins subcollection ke andar naya document
    await addDoc(collection(branchDocRef, "admins"), {
      name,
      email,
      branch,
      password
    });

    req.session.admin = { name, email, branch };
    res.redirect('/adminDashboard');
  } catch (error) {
    res.send("Error: " + error.message);
  }
});

// Student login
app.get('/login/student', (req, res) => {
  res.render('studentLogin');
});
app.post('/login/student', express.urlencoded({ extended: true }), async (req, res) => {
  const { email, password, branch, year, section } = req.body;
  try {
    // Branch document reference
    const branchDocRef = doc(db, "branches", branch);
    const q = query(
      collection(branchDocRef, "students"),
      where("email", "==", email)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return res.send("You do not exist, please register first.");
    }

    let studentData;
    querySnapshot.forEach((doc) => {
      studentData = doc.data();
    });

    if (studentData.password !== password) {
      return res.send("Incorrect password!");
    }

    // Session me student ki info save karo
    req.session.student = {
      name: studentData.name,
      email: studentData.email,
      enrolment: studentData.enrolment,
      branch: studentData.branch,
      year: studentData.year,
      section: studentData.section
    };

    // Login ke baad dashboard pe redirect karo
    res.redirect('/studentDashboard');
  } catch (error) {
    res.send("Error: " + error.message);
  }
});

// Teacher login
app.get('/login/teacher', (req, res) => {
  res.render('teacherLogin');
});
app.post('/login/teacher', express.urlencoded({ extended: true }), async (req, res) => {
  const { email, password, branch } = req.body;
  try {
    // Branch document reference
    const branchDocRef = doc(db, "branches", branch);

    // Teachers subcollection me email check karo
    const q = query(
      collection(branchDocRef, "teachers"),
      where("email", "==", email)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // Email exist nahi karta
      return res.send("You do not exist, please register first.");
    }

    // Email mil gaya, ab password check karo
    let teacherData;
    querySnapshot.forEach((doc) => {
      teacherData = doc.data();
    });

    if (teacherData.password !== password) {
      return res.send("Incorrect password!");
    }

    // Login success, session me save karo
    req.session.teacher = {
      name: teacherData.name,
      email: teacherData.email,
      branch: teacherData.branch,
      year: teacherData.year,     // Add year to session
      section: teacherData.section // Add section to session
    };

    res.redirect('/teacherDashboard');
  } catch (error) {
    res.send("Error: " + error.message);
  }
});

// Admin login
app.get('/login/admin', (req, res) => {
  res.render('adminLogin');
});
app.post('/login/admin', express.urlencoded({ extended: true }), async (req, res) => {
  let { email, password, branch } = req.body;
  email = email.trim().toLowerCase(); // normalize email
  console.log("Login Email:", email, "Branch:", branch);

  try {
    // Branch document reference
    const branchDocRef = doc(db, "branches", branch);

    // Branch ke andar admins subcollection me query karo
    const q = query(
      collection(branchDocRef, "admins"),
      where("email", "==", email)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return res.send("You do not exist, please register first.");
    }

    let adminData;
    querySnapshot.forEach((doc) => {
      adminData = doc.data();
    });

    if (adminData.password !== password) {
      return res.send("Incorrect password!");
    }

    req.session.admin = {
      name: adminData.name,
      email: adminData.email,
      branch: adminData.branch
    };

    res.redirect('/adminDashboard');
  } catch (error) {
    res.send("Error: " + error.message);
  }
});

app.get('/studentDashboard', async (req, res) => {
  if (!req.session.student) {
    return res.redirect('/login/student');
  }
  const branch = req.session.student.branch;
  const notifications = [];
  const q = query(
    collection(db, "notifications"),
    where("branch", "==", branch),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  snapshot.forEach(doc => notifications.push(doc.data().message));
  res.render('studentDashboard', {
    student: req.session.student,
    noDuesList: [], // yahan aap real data bhej sakte hain
    notifications
  });
});

app.get('/teacherDashboard', async (req, res) => {
  if (!req.session.teacher) {
    return res.redirect('/login/teacher');
  }
  const branch = req.session.teacher.branch;
  const notifications = [];
  const q = query(
    collection(db, "notifications"),
    where("branch", "==", branch),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  snapshot.forEach(doc => notifications.push(doc.data().message));
  res.render('teacherDashboard', { teacher: req.session.teacher, notifications });
});

// Add this route handler for adminDashboard
app.get('/adminDashboard', async (req, res) => {
  if (!req.session.admin) {
    return res.redirect('/login/admin');
  }
  
  try {
    const branch = req.session.admin.branch;
    
    // Fetch teachers from the admin's branch
    const branchDocRef = doc(db, "branches", branch);
    const teachersQuery = collection(branchDocRef, "teachers");
    const teachersSnapshot = await getDocs(teachersQuery);
    
    const teachers = [];
    teachersSnapshot.forEach(doc => {
      teachers.push(doc.data());
    });
    
    // Fetch notifications
    const notifications = [];
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("branch", "==", branch),
      orderBy("createdAt", "desc")
    );
    const notificationsSnapshot = await getDocs(notificationsQuery);
    notificationsSnapshot.forEach(doc => {
      notifications.push({
        id: doc.id,
        message: doc.data().message
      });
    });
    
    res.render('adminDashboard', { 
      admin: req.session.admin, 
      teachers: teachers,
      notifications: notifications
    });
  } catch (error) {
    res.send("Error: " + error.message);
  }
});

// Keep your existing /admin/dashboard route if needed
app.get('/admin/dashboard', (req, res) => {
  // Existing code to fetch admin data
  
  // Add this line to define notifications with an empty array as default
  const notifications = []; // or fetch from database if you have that functionality
  
  res.render('adminDashboard', { 
    admin: adminData, 
    teachers: teachersData,
    notifications: notifications // Add this line to pass notifications to the template
  });
});

app.get('/admin/filter', async (req, res) => {
  const { year, section } = req.query;
  const branch = req.session.admin.branch; // admin ki branch session se lo

  const branchDocRef = doc(db, "branches", branch);
  let q = collection(branchDocRef, "students");

  let filters = [];
  if (year) filters.push(where("year", "==", year));
  if (section) filters.push(where("section", "==", section));

  let finalQuery = filters.length > 0 ? query(q, ...filters) : q;

  const students = [];
  const snapshot = await getDocs(finalQuery);
  snapshot.forEach(docSnap => {
    students.push({
      id: docSnap.id,
      ...docSnap.data()
    });
  });

  res.render('filter', { students, branch, year, section });
});

const adminRoutes = require('./routes/admin');
app.use('/admin', adminRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
