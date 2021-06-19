const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const admin = require("firebase-admin");
const MongoClient = require("mongodb").MongoClient;
require('dotenv').config()

const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.s07ju.mongodb.net/burjAlArab?retryWrites=true&w=majority`;
const port = 5000;

const app = express();

app.use(cors()); // acts as a middleware
app.use(bodyParser.json()); // acts as a middleware

var serviceAccount = require("./configs/burj-al-arab-21-firebase-adminsdk-g26zu-8961fae6b5.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const bookings = client.db("burjAlArab").collection("bookings");

  // ========= WRITE DATA ========
  app.post("/addBooking", (req, res) => {
    const newBooking = req.body;
    bookings.insertOne(newBooking).then((result) => {
      res.send(result.insertedCount > 0);
    });
    console.log(newBooking);
  });

  // ========= READ DATA ========
  app.get("/bookings", (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith("Bearer ")) {
      const idToken = bearer.split(" ")[1];
      // console.log({ idToken });
      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          // console.log(tokenEmail, queryEmail);
          if (tokenEmail == queryEmail) {
            bookings.find({ email: queryEmail }).toArray((err, documents) => {
              res.status(200).send(documents);
            });
          } else {
            res.status(401).send("Unauthorized access");
          }
        })
        .catch((error) => {
          res.status(401).send("Unauthorized access");
        });
    } else {
      res.status(401).send("Unauthorized access");
    }
  });
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port);
