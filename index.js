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

app.get('/api/region/:region_id', (req, res) => {
    (async() => {
        try {
            const document = db.collection('region').doc(req.params.region_id);
            let region = await document.get();
            if (!region.exists)
                return res.status(404).send("Region does not exist");
            let region_data = region.data();
            let response = {
                name: region_data.name,
                description: region_data.description,
                images: region_data.images,
                generalTabs: region_data.generalTabs
            }
            let restaurants = [];
            let hotels = [];
            let activities = [];
            const poi_query = db.collection('region').doc(req.params.region_id).collection('poi');
            await poi_query.get().then(querySnapshot => {
                let pois = querySnapshot.docs;
                for (let currentPoi of pois) {
                    const shortPoi = {
                        nextUrl: "/" + currentPoi.id,
                        image: currentPoi.data().images[0],
                        name: currentPoi.data().name,
                        address: currentPoi.data().address,
                        rate: currentPoi.data().comments[0].rate,
                    }
                    if (currentPoi.data().type == "restaurant")
                        restaurants.push(shortPoi);
                    else if (currentPoi.data().type == "hotel")
                        hotels.push(shortPoi);
                    else if (currentPoi.data().type == "activity")
                        activities.push(shortPoi);
                }
            });
            if (restaurants.length > 0)
                response.restaurants = restaurants
            if (hotels.length > 0)
                response.hotels = hotels
            if (activities.length > 0)
                response.activities = activities
            return res.status(200).send(response);
        } catch (error) {
            return res.status(500).send(error);
        }
    })();
})

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