import admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

async function deleteTestTeams() {
  const targetNames = ['테스트테스트', '테스트스포츠', '테스트2', '사피에넷테스트', '테스트방'];
  console.log(`Searching for teams with names: ${targetNames.join(', ')}`);

  try {
    const teamsSnapshot = await db.collection('teams').get();
    let deletedCount = 0;

    for (const doc of teamsSnapshot.docs) {
      const data = doc.data();
      const teamName = data.teamName || '';
      
      // We check if the teamName exactly matches one of our target names,
      // or if it includes any of them (as a precaution, but let's be careful. The user said specifically those names).
      if (targetNames.includes(teamName) || teamName.includes('테스트')) {
        console.log(`Deleting team: ${teamName} (ID: ${doc.id})`);
        
        // Find all users who are part of this team using member_summaries
        const membersSnapshot = await db.collection(`teams/${doc.id}/member_summaries`).get();
        const batch = db.batch();
        
        for (const memberDoc of membersSnapshot.docs) {
          const userId = memberDoc.id;
          const userTeamRef = db.doc(`users/${userId}/teams/${doc.id}`);
          batch.delete(userTeamRef);
        }
        
        if (membersSnapshot.size > 0) {
          await batch.commit();
          console.log(`Removed team references for ${membersSnapshot.size} members.`);
        }

        // Recursively delete the team and all its subcollections
        await db.recursiveDelete(doc.ref);
        console.log(`Deleted team and subcollections for ${teamName} (${doc.id})`);
        deletedCount++;
      }
    }

    console.log(`Finished. Deleted ${deletedCount} test teams.`);
    process.exit(0);
  } catch (error) {
    console.error('Error deleting teams:', error);
    process.exit(1);
  }
}

deleteTestTeams();
