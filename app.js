const express = require('express');
const path = require('path');
const app = express();
const { db } = require('./config/firebase');
const { doc, collection, query, where, getDocs, addDoc, orderBy, Timestamp, deleteDoc } = require('firebase/firestore');
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
  
  try {
    const student = req.session.student;
    const branch = student.branch;
    
    // Fetch notifications
    const notifications = [];
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("branch", "==", branch),
      orderBy("createdAt", "desc")
    );
    
    const snapshot = await getDocs(notificationsQuery);
    snapshot.forEach(doc => notifications.push(doc.data().message));
    
    // Fetch the student's document to get the ID
    const branchDocRef = doc(db, "branches", branch);
    const studentsQuery = query(
      collection(branchDocRef, "students"),
      where("email", "==", student.email)
    );
    
    const studentSnapshot = await getDocs(studentsQuery);
    let studentId;
    let noDuesList = [];
    
    if (!studentSnapshot.empty) {
      studentSnapshot.forEach(doc => {
        studentId = doc.id;
      });
      
      // Now fetch approvals for this student
      if (studentId) {
        const studentDocRef = doc(collection(branchDocRef, "students"), studentId);
        const approvalsCollRef = collection(studentDocRef, "approvals");
        const approvalsSnapshot = await getDocs(approvalsCollRef);
        
        // Create a map to store the latest approval from each teacher
        const teacherApprovals = new Map();
        
        approvalsSnapshot.forEach(doc => {
          const approvalData = doc.data();
          const teacherName = approvalData.teacherName;
          
          // If this teacher already has an approval, check if this one is newer
          if (teacherApprovals.has(teacherName)) {
            const existingApproval = teacherApprovals.get(teacherName);
            const existingTimestamp = existingApproval.timestamp;
            const newTimestamp = approvalData.timestamp;
            
            // Keep the newer timestamp
            if (newTimestamp && existingTimestamp) {
              if (newTimestamp.toDate() > existingTimestamp.toDate()) {
                teacherApprovals.set(teacherName, {
                  id: doc.id,
                  ...approvalData
                });
              }
            } else if (newTimestamp && !existingTimestamp) {
              // If new has timestamp but existing doesn't, keep the new one
              teacherApprovals.set(teacherName, {
                id: doc.id,
                ...approvalData
              });
            }
            // If existing has timestamp but new doesn't, keep the existing one
          } else {
            // First approval from this teacher
            teacherApprovals.set(teacherName, {
              id: doc.id,
              ...approvalData
            });
          }
        });
        
        // Convert map values to array
        noDuesList = Array.from(teacherApprovals.values());
      }
    }
    
    res.render('studentDashboard', {
      student: student,
      noDuesList: noDuesList,
      notifications: notifications
    });
  } catch (error) {
    console.error("Error in student dashboard:", error);
    res.send("Error: " + error.message);
  }
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

// Add this route for teacher filter - make sure it's placed before the app.listen line
// Update the teacher filter route
app.get('/teacher/filter', async (req, res) => {
  if (!req.session.teacher) {
    return res.redirect('/login/teacher');
  }
  
  try {
    const { year, section } = req.query;
    
    // Get teacher's branches (could be an array)
    const teacherBranches = req.session.teacher.branch;
    
    // Convert to array if it's not already
    const branchesArray = Array.isArray(teacherBranches) ? teacherBranches : [teacherBranches];
    
    // Use the first branch for filtering
    const selectedBranch = branchesArray[0];
    
    const branchDocRef = doc(db, "branches", selectedBranch);
    let studentsCollection = collection(branchDocRef, "students");
    
    // Build filters based on query parameters
    let filters = [];
    if (year && year !== "All") filters.push(where("year", "==", year));
    if (section && section !== "All") filters.push(where("section", "==", section));
    
    // Apply filters if any
    let finalQuery = filters.length > 0 
      ? query(studentsCollection, ...filters) 
      : studentsCollection;
    
    // Get students
    const students = [];
    const snapshot = await getDocs(finalQuery);
    
    // Process each student
    for (const docSnap of snapshot.docs) {
      const studentData = {
        id: docSnap.id,
        ...docSnap.data(),
        approved: false
      };
      
      // Check if this student is already approved by this teacher
      const approvalsCollRef = collection(docSnap.ref, "approvals");
      const approvalsQuery = query(
        approvalsCollRef,
        where("teacherName", "==", req.session.teacher.name)
      );
      
      const approvalsSnapshot = await getDocs(approvalsQuery);
      if (!approvalsSnapshot.empty) {
        // Get the latest approval status
        const latestApproval = approvalsSnapshot.docs[0].data();
        studentData.approved = latestApproval.status === "Approved";
        studentData.currentStatus = latestApproval.status;
      }
      
      students.push(studentData);
    }
    
    res.render('teacherFilter', { 
      students, 
      branch: selectedBranch, 
      year: year || "All", 
      section: section || "All",
      teacherBranches: branchesArray
    });
  } catch (error) {
    console.error("Error in teacher filter:", error);
    res.send("Error: " + error.message);
  }
});

// Add a route for updating approvals
app.get('/teacher/update-approvals', async (req, res) => {
  if (!req.session.teacher) {
    return res.redirect('/login/teacher');
  }
  
  try {
    const { year, section } = req.query;
    
    // Redirect back to the filter page with the same parameters
    res.redirect(`/teacher/filter?year=${year || 'All'}&section=${section || 'All'}`);
  } catch (error) {
    console.error("Error updating approvals:", error);
    res.send("Error: " + error.message);
  }
});

// Make sure these routes are in your app.js file

// Add this middleware to parse JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Update the teacher approve-student route
app.post('/teacher/approve-student', async (req, res) => {
  if (!req.session.teacher) {
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }
  
  try {
    const { studentId, branch } = req.body;
    const teacherName = req.session.teacher.name;
    
    // Reference to the student document
    const branchDocRef = doc(db, "branches", branch);
    const studentDocRef = doc(collection(branchDocRef, "students"), studentId);
    
    // Create or update the approvals subcollection for this student
    const approvalsCollRef = collection(studentDocRef, "approvals");
    
    // Check if approval already exists for this teacher
    const existingApprovalQuery = query(
      approvalsCollRef,
      where("teacherName", "==", teacherName)
    );
    const existingApprovalSnapshot = await getDocs(existingApprovalQuery);
    
    if (!existingApprovalSnapshot.empty) {
      // Update existing approval
      const existingApprovalDoc = existingApprovalSnapshot.docs[0];
      const { updateDoc } = require('firebase/firestore');
      await updateDoc(existingApprovalDoc.ref, {
        status: "Approved",
        timestamp: Timestamp.now(),
        remarks: "No dues cleared"
      });
    } else {
      // Create new approval record
      await addDoc(approvalsCollRef, {
        teacherName: teacherName,
        status: "Approved",
        timestamp: Timestamp.now(),
        remarks: "No dues cleared"
      });
    }
    
    res.json({ success: true, message: "Student approved successfully" });
  } catch (error) {
    console.error("Error approving student:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Similarly update the reject-student route
app.post('/teacher/reject-student', async (req, res) => {
  if (!req.session.teacher) {
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }
  
  try {
    const { studentId, branch } = req.body;
    const teacherName = req.session.teacher.name;
    
    // Reference to the student document
    const branchDocRef = doc(db, "branches", branch);
    const studentDocRef = doc(collection(branchDocRef, "students"), studentId);
    
    // Create or update the approvals subcollection for this student
    const approvalsCollRef = collection(studentDocRef, "approvals");
    
    // Check if approval already exists for this teacher
    const existingApprovalQuery = query(
      approvalsCollRef,
      where("teacherName", "==", teacherName)
    );
    const existingApprovalSnapshot = await getDocs(existingApprovalQuery);
    
    if (!existingApprovalSnapshot.empty) {
      // Update existing approval
      const existingApprovalDoc = existingApprovalSnapshot.docs[0];
      const { updateDoc } = require('firebase/firestore');
      await updateDoc(existingApprovalDoc.ref, {
        status: "Rejected",
        timestamp: Timestamp.now(),
        remarks: "Dues pending"
      });
    } else {
      // Create new approval record
      await addDoc(approvalsCollRef, {
        teacherName: teacherName,
        status: "Rejected",
        timestamp: Timestamp.now(),
        remarks: "Dues pending"
      });
    }
    
    res.json({ success: true, message: "Student rejected successfully" });
  } catch (error) {
    console.error("Error rejecting student:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin Dashboard Route
app.get('/adminDashboard', async (req, res) => {
  if (!req.session.admin) {
    return res.redirect('/login/admin');
  }

  try {
    const admin = req.session.admin;
    const branch = admin.branch;

    // Fetch notifications
    const notifications = [];
    const notificationsQuery = query(
      collection(db, "notifications"),
      orderBy("createdAt", "desc")
    );
    
    const notificationsSnapshot = await getDocs(notificationsQuery);
    notificationsSnapshot.forEach(doc => {
      notifications.push({
        id: doc.id,
        message: doc.data().message
      });
    });

    // Fetch teachers from admin's branch
    const teachers = [];
    const branchDocRef = doc(db, "branches", branch);
    const teachersQuery = query(collection(branchDocRef, "teachers"));
    const teachersSnapshot = await getDocs(teachersQuery);
    
    teachersSnapshot.forEach(doc => {
      teachers.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.render('adminDashboard', {
      admin: admin,
      notifications: notifications,
      teachers: teachers,
      students: []
    });
  } catch (error) {
    console.error("Error in admin dashboard:", error);
    res.send("Error: " + error.message);
  }
});

// Admin send notification route
app.post('/admin/send-notification', async (req, res) => {
  if (!req.session.admin) {
    return res.redirect('/login/admin');
  }

  try {
    const { notification } = req.body;
    const admin = req.session.admin;

    await addDoc(collection(db, "notifications"), {
      message: notification,
      branch: admin.branch,
      createdAt: Timestamp.now()
    });

    res.redirect('/adminDashboard');
  } catch (error) {
    console.error("Error sending notification:", error);
    res.send("Error: " + error.message);
  }
});

// Admin delete notification route
app.post('/admin/delete-notification', async (req, res) => {
  if (!req.session.admin) {
    return res.redirect('/login/admin');
  }

  try {
    const { notificationId } = req.body;
    
    await deleteDoc(doc(db, "notifications", notificationId));
    res.redirect('/adminDashboard');
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.send("Error: " + error.message);
  }
});

// Admin filter students route
app.get('/admin/filter', async (req, res) => {
  if (!req.session.admin) {
    return res.redirect('/login/admin');
  }

  try {
    const { year, section } = req.query;
    const admin = req.session.admin;
    const branch = admin.branch;

    const branchDocRef = doc(db, "branches", branch);
    let studentsQuery = collection(branchDocRef, "students");

    // Apply filters
    let filters = [];
    if (year && year !== "All") filters.push(where("year", "==", year));
    if (section && section !== "All") filters.push(where("section", "==", section));

    if (filters.length > 0) {
      studentsQuery = query(studentsQuery, ...filters);
    }

    const students = [];
    const snapshot = await getDocs(studentsQuery);
    
    // Process each student to get their approval statuses
    for (const docSnap of snapshot.docs) {
      const studentData = {
        id: docSnap.id,
        ...docSnap.data(),
        approvals: []
      };
      
      // Fetch approvals for this student
      const studentDocRef = doc(collection(branchDocRef, "students"), docSnap.id);
      const approvalsCollRef = collection(studentDocRef, "approvals");
      const approvalsSnapshot = await getDocs(approvalsCollRef);
      
      // Create a map to store the latest approval from each teacher
      const teacherApprovals = new Map();
      
      approvalsSnapshot.forEach(approvalDoc => {
        const approvalData = approvalDoc.data();
        const teacherName = approvalData.teacherName;
        
        // If this teacher already has an approval, check if this one is newer
        if (teacherApprovals.has(teacherName)) {
          const existingApproval = teacherApprovals.get(teacherName);
          const existingTimestamp = existingApproval.timestamp;
          const newTimestamp = approvalData.timestamp;
          
          // Keep the newer timestamp
          if (newTimestamp && existingTimestamp) {
            if (newTimestamp.toDate() > existingTimestamp.toDate()) {
              teacherApprovals.set(teacherName, {
                id: approvalDoc.id,
                ...approvalData
              });
            }
          } else if (newTimestamp && !existingTimestamp) {
            // If new has timestamp but existing doesn't, keep the new one
            teacherApprovals.set(teacherName, {
              id: approvalDoc.id,
              ...approvalData
            });
          }
          // If existing has timestamp but new doesn't, keep the existing one
        } else {
          // First approval from this teacher
          teacherApprovals.set(teacherName, {
            id: approvalDoc.id,
            ...approvalData
          });
        }
      });
      
      // Convert map values to array
      studentData.approvals = Array.from(teacherApprovals.values());
      
      students.push(studentData);
    }

    res.render('filter', {
      students: students,
      branch: branch,
      year: year || "All",
      section: section || "All"
    });
  } catch (error) {
    console.error("Error in admin filter:", error);
    res.send("Error: " + error.message);
  }
});

// Admin delete student route
app.post('/admin/delete-student', async (req, res) => {
  if (!req.session.admin) {
    return res.redirect('/login/admin');
  }

  try {
    const { studentId } = req.body;
    const admin = req.session.admin;
    const branch = admin.branch;
    
    const branchDocRef = doc(db, "branches", branch);
    const studentDocRef = doc(collection(branchDocRef, "students"), studentId);
    
    await deleteDoc(studentDocRef);
    res.redirect('/adminDashboard');
  } catch (error) {
    console.error("Error deleting student:", error);
    res.send("Error: " + error.message);
  }
});

// Download certificate route
app.get('/downloadCertificate', (req, res) => {
  if (!req.session.student) {
    return res.redirect('/login/student');
  }
  
  // For now, just send a simple message
  // In a real application, you would generate a PDF certificate
  res.send(`
    <html>
      <head><title>No Dues Certificate</title></head>
      <body style="font-family: Arial, sans-serif; padding: 40px;">
        <h1>No Dues Certificate</h1>
        <p><strong>Student Name:</strong> ${req.session.student.name}</p>
        <p><strong>Enrolment Number:</strong> ${req.session.student.enrolment}</p>
        <p><strong>Branch:</strong> ${req.session.student.branch}</p>
        <p><strong>Year:</strong> ${req.session.student.year}</p>
        <p><strong>Section:</strong> ${req.session.student.section}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        <br>
        <p>This is to certify that the above student has cleared all dues.</p>
        <br>
        <p><strong>Note:</strong> This is a digital certificate generated by the No Dues System.</p>
        <br>
        <button onclick="window.print()">Print Certificate</button>
        <button onclick="window.history.back()">Back to Dashboard</button>
      </body>
    </html>
  `);
});

// Cleanup duplicate approvals route
app.get('/cleanup-duplicates', async (req, res) => {
  try {
    const { deleteDoc } = require('firebase/firestore');
    
    // Get all branches
    const branchesSnapshot = await getDocs(collection(db, "branches"));
    
    let totalCleaned = 0;
    
    for (const branchDoc of branchesSnapshot.docs) {
      const branchName = branchDoc.id;
      const branchDocRef = doc(db, "branches", branchName);
      
      // Get all students in this branch
      const studentsSnapshot = await getDocs(collection(branchDocRef, "students"));
      
      for (const studentDoc of studentsSnapshot.docs) {
        const studentDocRef = doc(collection(branchDocRef, "students"), studentDoc.id);
        const approvalsCollRef = collection(studentDocRef, "approvals");
        const approvalsSnapshot = await getDocs(approvalsCollRef);
        
        // Group approvals by teacher name
        const teacherApprovals = new Map();
        
        approvalsSnapshot.forEach(approvalDoc => {
          const approvalData = approvalDoc.data();
          const teacherName = approvalData.teacherName;
          
          if (!teacherApprovals.has(teacherName)) {
            teacherApprovals.set(teacherName, []);
          }
          teacherApprovals.get(teacherName).push({
            id: approvalDoc.id,
            ref: approvalDoc.ref,
            data: approvalData
          });
        });
        
        // For each teacher, keep only the latest approval and delete others
        for (const [teacherName, approvals] of teacherApprovals) {
          if (approvals.length > 1) {
            // Sort by timestamp (newest first)
            approvals.sort((a, b) => {
              const timestampA = a.data.timestamp ? a.data.timestamp.toDate() : new Date(0);
              const timestampB = b.data.timestamp ? b.data.timestamp.toDate() : new Date(0);
              return timestampB - timestampA;
            });
            
            // Keep the first one (latest), delete the rest
            for (let i = 1; i < approvals.length; i++) {
              await deleteDoc(approvals[i].ref);
              totalCleaned++;
            }
          }
        }
      }
    }
    
    res.send(`Cleanup completed! Removed ${totalCleaned} duplicate approval records.`);
  } catch (error) {
    console.error("Error during cleanup:", error);
    res.send("Error during cleanup: " + error.message);
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
