

const myAdmin = require('firebase-admin');
const db = myAdmin.firestore();

function getDocPathInCollection(docId) {
    return db.doc('production/production/money/' + docId);
}

export async function createMoneyDoc(change) {
    const userId = change.after.get('userId');
    const adults = change.after.get('adults');
    if (adults == undefined) return;
    if (adults <= 0) return;
    await createMoneyDocInDB(userId)
}

export async function payForExchange() {
    //await createMoneyDoc()
}

async function createMoneyDocInDB(userId) {
    const doc = await getDocPathInCollection(userId).get();
    if (doc.exists) return;
    await getDocPathInCollection(userId).set(moneyDocInitialJson());   
}

function moneyDocInitialJson() {
    const m = {}
    m['registrationCount'] = 50;
    m['registrationDate'] = myAdmin.firestore.Timestamp.now()
    m['friendsInvited'] = []
    m['exchanges'] = []
    m['reviews'] = []
    return m;
}