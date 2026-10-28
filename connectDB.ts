"use server"
import mongoose from 'mongoose';

// MongoDB connection URI
const mongoURI = process.env.URI!;
const mongoConnection: { promise: Promise<typeof mongoose> | null, connection: typeof mongoose | null } = {
  promise: null,
  connection: null
}

let courseIndexRepair: Promise<void> | null = null;

/**
 * Older versions declared a text index on the `courses` collection. MongoDB uses
 * the `language` field of a document as the text-search language override, and a
 * course also stores its own human language ("hi", "English", …). Saving a course
 * then fails with "language override unsupported". The index was never queried
 * (searches use regex), so drop it once per process if it still exists.
 */
const repairCourseIndexes = async () => {
  if (!courseIndexRepair) {
    courseIndexRepair = (async () => {
      const collection = mongoose.connection.collection("courses");
      const indexes = await collection.indexes();
      const textIndexes = indexes.filter((index) => Object.values(index.key ?? {}).includes("text"));
      for (const index of textIndexes) {
        if (index.name) await collection.dropIndex(index.name);
      }
    })().catch((error) => {
      console.error("Could not drop the legacy course text index:", error);
    });
  }
  await courseIndexRepair;
};

const connectDB = async () => {
  if (mongoConnection.promise) {
    mongoConnection.connection = await mongoConnection.promise;
    return mongoConnection.connection;
  }

  // Establishing connection with MongoDB
  mongoConnection.promise = mongoose.connect(mongoURI)
    .then((connection) => {
      mongoConnection.connection = connection;
      return connection;
    })
    .catch(err => {
      mongoConnection.promise = null;
      mongoConnection.connection = null;
      console.error('MongoDB connection error:', err);
      throw err;
    });

  await mongoConnection.promise;
  await repairCourseIndexes();

  return mongoConnection.connection;
}

export default connectDB;
