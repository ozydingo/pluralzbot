const Firestore = require('@google-cloud/firestore');
const PROJECTID = 'playground-252414';
const COLLECTION_NAME = '3playaz';
const firestore = new Firestore({
  projectId: PROJECTID,
});

exports.find = async (id) => {
  const result = await firestore.collection(COLLECTION_NAME).where(
    'user_id', '==', String(id)
  ).limit(1).get();
  return result.docs.map(doc => doc.data())[0];
}
