import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;

export default async () => {
  // Start the in-memory mongodb instance
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  // Set the environment variable so the app uses the in-memory DB during tests
  process.env.MONGODB_URI = uri;
  process.env.JWT_SECRET = 'test_secret';

  // Store the mongod instance in global to teardown later
  (global as unknown as { __MONGOD__: MongoMemoryServer }).__MONGOD__ = mongod;
};
