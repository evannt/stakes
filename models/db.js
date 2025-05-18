const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_CONNECTION_STRING;
const client = new MongoClient(uri);
let db;

async function connect() {
  try {
    await client.connect();
    db = client.db(process.env.MONGO_DB_NAME);
    const collection = db.collection(process.env.MONGO_COLLECTION);
    await collection.createIndex({ score: -1 });
    console.log('Connected to MongoDB Atlas');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}


function getCollection() {
  return db.collection(process.env.MONGO_COLLECTION);
}

async function saveScore(username, score) {
    try {
        const collection = getCollection();
        // Check if username already exists
        const existingUser = await collection.findOne({ username });
        if (existingUser) {
            throw new Error('Username already exists. Please choose a unique username.');
        }
        await collection.insertOne({
            username,
            score: Number(score),
            createdAt: new Date()
        });
    } catch (error) {
        console.error('Error saving score:', error);
        throw error;
    }
}

async function getTopScores(limit = 10) {
  try {
    const collection = getCollection();
    return await collection.find()
      .sort({ score: -1 })
      .limit(limit)
      .toArray();
  } catch (error) {
    console.error('Error fetching top scores:', error);
    throw error;
  }
}

module.exports = { connect, saveScore, getTopScores };