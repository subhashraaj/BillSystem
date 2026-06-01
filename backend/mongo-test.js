const { MongoClient } = require("mongodb");

const uri = "mongodb://subhash:subhash@0706@ac-ekrplvn-shard-00-00.agqfabd.mongodb.net:27017,ac-ekrplvn-shard-00-01.agqfabd.mongodb.net:27017,ac-ekrplvn-shard-00-02.agqfabd.mongodb.net:27017/?ssl=true&replicaSet=atlas-14d0mn-shard-0&authSource=admin&appName=Cluster0";

const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("✅ Native driver connected");
  } catch (err) {
    console.error("❌ Native driver error:", err);
  } finally {
    await client.close();
  }
}

run();