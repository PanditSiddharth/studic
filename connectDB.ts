"use server"
import mongoose from 'mongoose';

// MongoDB connection URI
const mongoURI = process.env.URI!;
const mongoConnection: { promise: Promise<typeof mongoose> | null, connection: typeof mongoose | null } = {
  promise: null,
  connection: null
}

const connectDB = async () => {
  if (mongoConnection.promise) {
    console.info('Instance already exists');
    mongoConnection.connection = await mongoConnection.promise;
    return mongoConnection.connection;
  }

  // Establishing connection with MongoDB
  mongoConnection.connection = await mongoose.connect(mongoURI)
    .catch(err => {
      console.error('MongoDB connection error:', err);
      throw err;
    });

  return mongoConnection.connection;
}

export default connectDB;
