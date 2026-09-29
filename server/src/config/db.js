import mongoose from 'mongoose';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let localMongodProcess = null;

async function ensureMongoConnected(uri) {
  const isLocal =
    uri.includes('127.0.0.1') || uri.includes('localhost') || uri.includes('0.0.0.0');

  // For MongoDB Atlas (mongodb+srv://) or remote servers, allow full 15s TLS handshake timeout
  if (!isLocal) {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
    console.log(`✅ Connected to MongoDB Atlas cluster`);
    return true;
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    console.log(`✅ Connected to local MongoDB at ${uri}`);
    return true;
  } catch {
    console.log('⚙️ Local MongoDB daemon not detected on 27017. Starting local mongod instance...');
    const dataDir = path.resolve(__dirname, '../../.mongo-data');
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
  const uri = (process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ticketbook')
    .replace(/^["']|["']$/g, '')
    .trim();
  await ensureMongoConnected(uri);
};
