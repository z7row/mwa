import { MongoClient, ObjectId } from 'mongodb';
export async function db() {
  global._mp ||= new MongoClient(process.env.MONGODB_URI).connect();
  return (await global._mp).db('mwa');
}
export { ObjectId };
