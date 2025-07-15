const express = require('express');
const path = require('path');
const app = express();
const { db } = require('./config/firebase');
const { doc, collection, query, where, getDocs, addDoc } = require('firebase/firestore');
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
    // Firestore me data store karo (aapka existing code)
    await addDoc(collection(db, "students"), {
      name,
      email,
      enrolment,
      branch,
      year,
      section,
      password
    });

    // Session me student ki info save karo
    req.session.student = { name, email, enrolment, branch, year, section };

    // Registration ke baad dashboard pe redirect karo
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

  // Ensure branch, year, section are arrays
  if (!Array.isArray(branch)) branch = [branch];
  if (!Array.isArray(year)) year = [year];
  if (!Array.isArray(section)) section = [section];

  await addDoc(collection(db, "teachers"), {
    name,
    email,
    branch,
    year,
    section,
    password
  });

  req.session.teacher = { name, email, branch, year, section };

  res.redirect('/teacherDashboard');
});

// Admin registration
app.get('/register/admin', (req, res) => {
  res.render('adminRegister');
});
app.post('/register/admin', express.urlencoded({ extended: true }), async (req, res) => {
  const { name, email, branch, password } = req.body;
  console.log("Admin registration data:", req.body);
  try {
    const branchDocRef = doc(db, "branches", branch);

    await addDoc(collection(branchDocRef, "admins"), {
      name,
      email,
      branch,
      password
    });

    res.send("Admin registered successfully!");
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
    // Firestore se student find karo (aapka existing code)
    const q = query(
      collection(db, "students"),
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
      branch: teacherData.branch
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
  const { email, password, branch } = req.body;
  try {
    const branchDocRef = doc(db, "branches", branch);

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

app.get('/studentDashboard', (req, res) => {
  if (!req.session.student) {
    return res.redirect('/login/student');
  }
  res.render('studentDashboard', {
    student: req.session.student,
    noDuesList: [], // yahan aap real data bhej sakte hain
    notifications: []
  });
});

app.get('/teacherDashboard', (req, res) => {
  if (!req.session.teacher) {
    return res.redirect('/login/teacher');
  }
  res.render('teacherDashboard', { teacher: req.session.teacher });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
