const Firestore = require('@google-cloud/firestore');
const PROJECTID = 'enhanced-optics-219215';
const COLLECTION_NAME = 'userz';
const firestore = new Firestore({
  projectId: PROJECTID,
});
const collection = firestore.collection(COLLECTION_NAME);

async function find({userId, teamId}) {
  const result = await collection.where(
    'user_id', '==', String(userId)
  ).where(
    'team_id', '==', String(teamId)
  ).limit(1).get();
  return result.docs[0];
}

async function find_or_create({userId, teamId}) {
  const user = await find({userId, teamId});
  if (user) { return user; }
  const ref = await collection.add({
    user_id: userId,
    team_id: teamId,
  });
  const newUser = await ref.get();
  return newUser;
}

async function touch({userId, teamId}) {
  const ts = new Date();
  const user = await(find_or_create({userId, teamId}));
  return collection.doc(user.id).update({
    bugged_at: ts,
  });
}

async function setName(name, {userId, teamId}) {
  const user = await(find_or_create({userId, teamId}));
  return collection.doc(user.id).update({
    name: name
  });
}

async function setParticipation(value, { userId, teamId, name } = {}) {
  const user = await(find_or_create({userId, teamId}));
  const attrs = {participation: value};
  if (name) { attrs.name = name; }
  return collection.doc(user.id).update(attrs);
}

async function setToken(token, { userId, teamId, name } = {}) {
  const user = await(find_or_create({userId, teamId}));
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
