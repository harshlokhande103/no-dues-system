// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { doc, collection, getDocs, query, where, addDoc, Timestamp, orderBy, deleteDoc } = require('firebase/firestore');

router.get('/filter', async (req, res) => {
  const { branch, year, section } = req.query;
  let students = [];

  if (branch) {
    const branchDocRef = doc(db, "branches", branch);
    let q = collection(branchDocRef, "students");

    // Firestore me filter lagane ke liye query ka use karo
    let filters = [];
    if (year) filters.push(where("year", "==", year));
    if (section) filters.push(where("section", "==", section));

    let finalQuery = filters.length > 0 ? query(q, ...filters) : q;

    const snapshot = await getDocs(finalQuery);
    snapshot.forEach(docSnap => {
      students.push({
        id: docSnap.id, // yeh zaruri hai!
        ...docSnap.data()
      });
    });
  }

  res.render('filter', { students, branch, year, section });
});

router.post('/send-notification', async (req, res) => {
  const { notification } = req.body;
  try {
    await addDoc(collection(db, "notifications"), {
      message: notification,
      createdAt: Timestamp.now()
    });
    res.redirect('back'); // reloads the same page
  } catch (error) {
    res.send("Error sending notification: " + error.message);
  }
});

router.post('/admin/delete-student', async (req, res) => {
  const { studentId, branch } = req.body;
  try {
    // branch ke andar students subcollection me se document delete karo
    const studentDocRef = doc(db, "branches", branch, "students", studentId);
    await deleteDoc(studentDocRef);
    res.redirect('back');
  } catch (error) {
    res.send("Error deleting student: " + error.message);
  }
});

router.get('/adminDashboard', async (req, res) => {
  if (!req.session.admin) {
    return res.redirect('/login/admin');
  }

  // Agar aap notifications fetch nahi kar rahe, to kam se kam empty array bhejein:
  const notifications = [];

  // ...agar aap Firestore se fetch kar rahe hain to yahan fetch karo...
  const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  snapshot.forEach(docSnap => {
    notifications.push({
      id: docSnap.id,
      message: docSnap.data().message
    });
  });

  res.render('adminDashboard', {
    admin: req.session.admin,
    notifications, // YEH LINE ZARUR HO!
    // ...other data
  });
});

module.exports = router;
