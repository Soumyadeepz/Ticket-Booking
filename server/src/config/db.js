import mongoose from 'mongoose';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const __dirname = process.cwd();

let localMongodProcess = null;

const DEFAULT_ATLAS_URI =
  'mongodb+srv://soumyadeepd769_db_user:MO2hsNhfjPR6X3ps@cluster0.yxfk93r.mongodb.net/ticketbook';

async function ensureMongoConnected(uri) {
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  const isLocal =
    uri.includes('127.0.0.1') || uri.includes('localhost') || uri.includes('0.0.0.0');

  if (!isLocal || process.env.VERCEL) {
    const targetUri = isLocal ? DEFAULT_ATLAS_URI : uri;
    await mongoose.connect(targetUri, { serverSelectionTimeoutMS: 12000 });
    console.log('✅ Connected to MongoDB Atlas cluster');
    return true;
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    console.log(`✅ Connected to local MongoDB at ${uri}`);
    return true;
  } catch {
    console.log('⚙️ Local MongoDB daemon not detected on 27017. Starting local mongod instance...');
    const dataDir = path.resolve(__dirname, '.mongo-data');
    const logPath = path.resolve(dataDir, 'mongod.log');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    localMongodProcess = spawn(
      '/usr/bin/mongod',
      [
        '--dbpath',
        dataDir,
        '--port',
        '27017',
        '--bind_ip',
        '127.0.0.1',
        '--nounixsocket',
        '--logpath',
        logPath,
      ],
      { detached: true, stdio: 'ignore' }
    );
    localMongodProcess.unref();

    for (let i = 0; i < 16; i++) {
      await new Promise((r) => setTimeout(r, 500));
      try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
        console.log(`✅ Started & connected to local MongoDB at ${uri}`);
        return true;
      } catch {
        // retry
      }
    }
    throw new Error('Could not connect to or spawn MongoDB');
  }
}

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }
  const uri = (process.env.MONGO_URI || DEFAULT_ATLAS_URI)
    .replace(/^["']|["']$/g, '')
    .trim();
  await ensureMongoConnected(uri);
};
