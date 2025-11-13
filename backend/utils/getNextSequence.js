import Counter from '../models/Counter.js';

export default async function getNextSequence(name, session) {
  const counter = await Counter.findOneAndUpdate(
    { name },
    { $inc: { value: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true, session }
  );

  return counter.value;
}

