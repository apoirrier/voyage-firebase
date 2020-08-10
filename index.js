const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors({ origin: true }));

var serviceAccount = require("./permissions.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://voyages-pppc.firebaseio.com"
});

const db = admin.firestore();

// read PoI
app.get('/api/poi/:region_id/:poi_id', (req, res) => {
    (async() => {
        try {
            const document = db.collection('region').doc(req.params.region_id).collection('poi').doc(req.params.poi_id);
            let item = await document.get();
            if (!item.exists)
                return res.status(404).send("Data does not exist");
            let response = item.data();
            return res.status(200).send(response);
        } catch (error) {
            return res.status(500).send(error);
        }
    })();
});

app.post('/api/blop', (req, res) => {
    (
        async() => {
            try {
                const document = db.collection('region').doc('graubünden').collection('poi').doc('schauenstein');
                let item = await document.get();
                await db.collection('region').doc('graubunden').collection('poi').doc('schauenstein').set(item.data());
                return res.status(200).send();
            } catch (error) {
                return res.status(500).send(error);
            }
        })();
});

// create
app.post('/api/create', (req, res) => {
    (async() => {
        try {
            await db.collection('items').doc('/' + req.body.id + '/')
                .create({ item: req.body.item });
            return res.status(200).send();
        } catch (error) {
            console.log(error);
            return res.status(500).send(error);
        }
    })();
});

exports.app = functions.https.onRequest(app);