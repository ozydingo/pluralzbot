const Firestore = require('@google-cloud/firestore');
const PROJECTID = 'enhanced-optics-219215';
const COLLECTION_NAME = 'userz';
const firestore = new Firestore({
  projectId: PROJECTID,
});
const collection = firestore.collection(COLLECTION_NAME);

async function find(userId) {
  const result = await collection.where(
    'user_id', '==', String(userId)
  ).limit(1).get();
  return result.docs[0];
}

async function find_or_create(userId) {
  const user = await find(userId);
  if (user) { return user; }
  const ref = await collection.add({
    user_id: userId,
  });
  const newUser = await ref.get();
  return newUser;
}

async function touch(userId) {
  const ts = new Date();
  const user = await(find_or_create(userId));
  return collection.doc(user.id).update({
    bugged_at: ts,
  });
}

async function setName(userId, name) {
  const user = await(find_or_create(userId));
  return collection.doc(user.id).update({
    name: name
  });
}

async function setParticipation(userId, value, { name } = {}) {
  const user = await(find_or_create(userId));
  const attrs = {participation: value};
  if (name) { attrs.name = name; }
  return collection.doc(user.id).update(attrs);
}

async function setToken(userId, token, { name } = {}) {
  const user = await(find_or_create(userId));
  const attrs = { token };
  if (name) { attrs.name = name; }
  return collection.doc(user.id).update(attrs);
}

async function setLastEventId(userDoc, lastEventId) {
  return collection.doc(userDoc.id).update({lastEventId: lastEventId});
}

module.exports = {
  find,
  find_or_create,
  setLastEventId,
  setName,
  setParticipation,
  setToken,
  touch,
};
