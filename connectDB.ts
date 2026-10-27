"use server"
import mongoose from 'mongoose';

// MongoDB connection URI
const mongoURI = process.env.URI!;
const mongoConnection: { promise: Promise<typeof mongoose> | null } = {
  promise: null,
}

const connectDB = async () => {
  if (mongoConnection.promise) {
    console.info('Instance already exists');
    return mongoConnection.promise;
  }

  // Establishing connection with MongoDB
  mongoConnection.promise = mongoose.connect(mongoURI)
    .then((conn) => {
      console.info('MongoDB connected',  conn);
      return conn;
    })
    .catch(err => {
      console.error('MongoDB connection error:', err);
      throw err;
    });

  return mongoConnection.promise;
}

export default connectDB;
