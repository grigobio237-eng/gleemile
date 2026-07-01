import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';

// .env.local 로드
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// User 스키마 (스크립트용 간소화)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, default: 'member' },
  grade: { type: String, default: 'cedar' },
  tier: { type: String, default: 'RESET' },
  provider: { type: String, default: 'local' },
  emailVerified: { type: Boolean, default: true },
  isNavigator: { type: Boolean, default: false },
  marketingConsent: { type: Boolean, default: true },
  points: { type: Number, default: 0 },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function seedTestUsers() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gleemile';
    console.log('Connecting to MongoDB:', uri);
    await mongoose.connect(uri);
    console.log('Connected!');

    const emails = [
      'test@gleemile.com',
      'test1@gleemile.com',
      'test2@gleemile.com',
      'test3@gleemile.com'
    ];
    const password = 'test123';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        console.log(`User ${email} already exists. Updating password...`);
        existingUser.passwordHash = passwordHash;
        await existingUser.save();
      } else {
        console.log(`Creating user ${email}...`);
        const newUser = new User({
          email,
          passwordHash,
          name: `Test User ${i === 0 ? '' : i}`,
          role: 'member',
          grade: 'cedar',
          tier: 'RESET',
          provider: 'local',
          emailVerified: true
        });
        await newUser.save();
      }
    }

    console.log('Test accounts created successfully!');
  } catch (error) {
    console.error('Error creating users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

seedTestUsers();
