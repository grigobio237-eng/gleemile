const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/gleemile');
  const db = mongoose.connection.db;
  const passwordHash = await bcrypt.hash('password123', 10);
  await db.collection('users').updateOne(
    { email: 'test@gleemile.com' }, 
    { $set: { 
        email: 'test@gleemile.com', 
        name: '테스트 호스트', 
        passwordHash, 
        provider: 'local', 
        emailVerified: true, 
        role: 'admin' 
    } }, 
    { upsert: true }
  );
  console.log('Test user created: test@gleemile.com / password123');
  process.exit(0);
}

main().catch(console.error);
