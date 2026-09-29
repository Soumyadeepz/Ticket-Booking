import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User } from '../models/User.js';

dotenv.config();

const runMakeAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const targetIdentifier = process.argv[2]?.trim().toLowerCase();
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@ticketbook.com').toLowerCase();
    const adminUsername = (process.env.ADMIN_USERNAME || 'admin').toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@1234';

    // Reset all non-dedicated accounts to role: 'user' so normal users cannot see Admin section
    await User.updateMany(
      { email: { $ne: targetIdentifier || adminEmail } },
      { $set: { role: 'user' } }
    );

    if (targetIdentifier) {
      const user = await User.findOneAndUpdate(
        { $or: [{ email: targetIdentifier }, { username: targetIdentifier }] },
        { $set: { role: 'admin', isVerified: true } },
        { new: true }
      );
      if (user) {
        console.log(`✅ Promoted ${user.email} (${user.username}) to role: 'admin'`);
      } else {
        console.log(`❌ No user found matching "${targetIdentifier}"`);
      }
    } else {
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      const adminUser = await User.findOneAndUpdate(
        { email: adminEmail },
        {
          $set: {
            name: 'TicketBook Admin',
            username: adminUsername,
            email: adminEmail,
            passwordHash,
            role: 'admin',
            isVerified: true,
            avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=ticketbook_admin',
          },
        },
        { upsert: true, new: true }
      );
      console.log(
        `✅ Dedicated Admin account ready -> Email: ${adminUser.email} | Username: ${adminUser.username} | Password: ${adminPassword}`
      );
      console.log(`🔒 All normal customer accounts have been set to role: 'user'.`);
    }
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('makeAdmin error:', err);
    process.exit(1);
  }
};

runMakeAdmin();
