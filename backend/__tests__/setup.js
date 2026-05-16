const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.setTimeout(60000); // Allow time for MongoMemoryServer to download binary

let mongoServer;

beforeAll(async () => {
  let mongoUri;

  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoServer = await MongoMemoryServer.create();
    mongoUri = mongoServer.getUri();
  } catch (error) {
    console.warn('MongoMemoryServer failed, falling back to test database: ', error.message);
    mongoUri = 'mongodb://mongodb:27017/task-manager-test';
  }
  
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});
