const { db } = require('./config/firebase');
const { doc, collection, getDocs, deleteDoc } = require('firebase/firestore');

async function cleanupDuplicates() {
  try {
    console.log('Starting cleanup of duplicate approval records...');
    
    // Get all branches
    const branchesSnapshot = await getDocs(collection(db, "branches"));
    
    let totalCleaned = 0;
    
    for (const branchDoc of branchesSnapshot.docs) {
      const branchName = branchDoc.id;
      console.log(`Processing branch: ${branchName}`);
      const branchDocRef = doc(db, "branches", branchName);
      
      // Get all students in this branch
      const studentsSnapshot = await getDocs(collection(branchDocRef, "students"));
      
      for (const studentDoc of studentsSnapshot.docs) {
        const studentDocRef = doc(collection(branchDocRef, "students"), studentDoc.id);
        const approvalsCollRef = collection(studentDocRef, "approvals");
        const approvalsSnapshot = await getDocs(approvalsCollRef);
        
        if (approvalsSnapshot.size > 0) {
          console.log(`Student ${studentDoc.id} has ${approvalsSnapshot.size} approval records`);
        }
        
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
            console.log(`Found ${approvals.length} approvals from teacher ${teacherName}, keeping latest...`);
            
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
              console.log(`Deleted duplicate approval ${approvals[i].id} from teacher ${teacherName}`);
            }
          }
        }
      }
    }
    
    console.log(`Cleanup completed! Removed ${totalCleaned} duplicate approval records.`);
  } catch (error) {
    console.error("Error during cleanup:", error);
  }
}

// Run the cleanup
cleanupDuplicates(); 