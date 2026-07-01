import * as admin from 'firebase-admin';
import * as path from 'path';
import * as dotenv from 'dotenv';

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

const normalizeRole = (role: string | undefined): string => {
  if (!role) return 'guest';
  
  switch (role) {
    case 'head_coach':
    case 'director':
    case 'leader':
    case 'owner':
      return 'owner';
    case 'coach':
    case 'manager':
      return 'manager';
    case 'member':
      return 'member';
    case 'supporter':
    case 'guest':
    default:
      return 'guest';
  }
};

async function migrateRoles() {
  console.log('🚀 Starting Role Migration...');

  let teamMembersMigrated = 0;
  let userTeamsMigrated = 0;

  try {
    // 1. Migrate team_members collection
    const teamMembersRef = db.collection('team_members');
    const teamMembersSnap = await teamMembersRef.get();
    
    console.log(`Found ${teamMembersSnap.size} team_members documents.`);
    
    const teamMembersBatch = db.batch();
    teamMembersSnap.docs.forEach((doc) => {
      const data = doc.data();
      const currentRole = data.role;
      const newRole = normalizeRole(currentRole);
      
      if (currentRole !== newRole) {
        teamMembersBatch.update(doc.ref, { role: newRole });
        teamMembersMigrated++;
      }
    });

    if (teamMembersMigrated > 0) {
      await teamMembersBatch.commit();
      console.log(`✅ Migrated ${teamMembersMigrated} team_members documents.`);
    } else {
      console.log(`✅ No team_members documents needed migration.`);
    }

    // 2. Migrate users/{userId}/teams subcollections
    // This requires querying group collections or iterating over all users
    const usersRef = db.collection('users');
    const usersSnap = await usersRef.get();
    
    console.log(`Found ${usersSnap.size} users. Checking their teams subcollections...`);

    let batches = [];
    let currentBatch = db.batch();
    let currentBatchCount = 0;

    for (const userDoc of usersSnap.docs) {
      const userTeamsRef = userDoc.ref.collection('teams');
      const userTeamsSnap = await userTeamsRef.get();

      userTeamsSnap.docs.forEach((teamDoc) => {
        const data = teamDoc.data();
        const currentRole = data.role;
        
        if (currentRole) {
          const newRole = normalizeRole(currentRole);
          if (currentRole !== newRole) {
            currentBatch.update(teamDoc.ref, { role: newRole });
            userTeamsMigrated++;
            currentBatchCount++;

            if (currentBatchCount >= 500) {
              batches.push(currentBatch);
              currentBatch = db.batch();
              currentBatchCount = 0;
            }
          }
        }
      });
    }

    if (currentBatchCount > 0) {
      batches.push(currentBatch);
    }

    for (let i = 0; i < batches.length; i++) {
      await batches[i].commit();
    }

    if (userTeamsMigrated > 0) {
      console.log(`✅ Migrated ${userTeamsMigrated} users/{userId}/teams documents.`);
    } else {
      console.log(`✅ No users/{userId}/teams documents needed migration.`);
    }

    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

migrateRoles().then(() => process.exit(0));
