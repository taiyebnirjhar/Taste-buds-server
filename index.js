const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// middle_wares

app.use(cors());
app.use(express.json());

/*****************************/

const uri = `mongodb+srv://${process.env.TASTEBUDS_USER}:${process.env.TASTEBUDS_PASSWORD}@cluster0.bgiqi0m.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
const validateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).send({ message: "unauthorized access" });
  }

  const authToken = authHeader.split(" ")[1];
  jwt.verify(
    authToken,
    process.env.ACCESS_TOKEN_SECRET,
    function (err, decoded) {
      if (err) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      console.log(decoded);
      req.decoded = decoded;
      next();
    }
  );
  console.log();
};

(async function () {
  try {
    const menu = client.db("tastebuds-officialDB").collection("services");
    const menuComments = client
      .db("tastebuds-officialDB")
      .collection("menuComments");
    /*****************************[jwt]***********************************/
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const userToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "7d",
      });
      // console.log(user, userToken);
      res.send({ userToken });
    });
    /*****************************[jwt ends]***********************************/

    /*****************************[read]***********************************/
    /*****[read all menu services]****/

    app.get("/menu", async (req, res) => {
      const query = {};
      const cursor = menu.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });

    /*************************************/
    /*****[read limited menu services]****/
    app.get("/", async (req, res) => {
      const first_three = menu.find({}).limit(3);
      const services = await first_three.toArray();

      res.send(services);
    });
    /*************************************/

    /*****[read particular menu services]****/

    app.get("/menuComments/:id", async (req, res) => {
      const id = req.params.id;

      const query = {
        productId: `${id}`,
      };
      const cursor = menuComments.find(query).sort({ date: -1, time: -1 });

      const selectedServiceComment = await cursor.toArray();

      console.log(query);
      res.send(selectedServiceComment);
    });
    /*************************************/
    /*****[read particular  service comments]****/
    app.get("/menuDetails/:id", async (req, res) => {
      const id = req.params.id;

      const query = { _id: ObjectId(`${id}`) };
      const cursor = menu.find(query);

      const selectedService = await cursor.toArray();

      /*******[not needed]******/

      const alt_selectedService = await menu.findOne(query);
      /*******[not needed]******/

      res.send(selectedService);
    });
    /*****[read particular  user comments comments]****/
    app.get("/userReviews/:id", validateJWT, async (req, res) => {
      const decoded = req.decoded;
      const id = req.params.id;

      if (decoded?.userId !== id) {
        res.status(403).send({ message: "unauthorized access" });
      }

      const query = {
        userId: `${id}`,
      };
      const cursor = menuComments.find(query);

      const userComments = await cursor.toArray();

      res.send(userComments);
    });
    /*****************************[read end]***********************************/

    /*****************************[create]***********************************/

    /*****[post new service]****/
    app.post("/menu", async (req, res) => {
      const new_menu = req.body;
      const result = await menu.insertOne(new_menu);
      res.send(result);
    });
    /*****[post new comment]****/
    app.post("/menuDetails/:id", async (req, res) => {
      const new_comment = req.body;
      const result = await menuComments.insertOne(new_comment);
      res.send(result);
    });

    /*****************************[create ends]***********************************/

    /*****************************[update ]***********************************/

    app.patch("/updateSelectedReview/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(`${id}`) };
      const review = req.body;
      const options = { upsert: true };
      const updatedReview = {
        $set: {
          comment: review.comment,
        },
      };
      const result = await menuComments.updateOne(
        query,
        updatedReview,
        options
      );
      res.send(result);
      console.log(review, id, query, updatedReview);
    });
    /*****************************[update ends]***********************************/

    /*****************************[Delete ]***********************************/
    app.delete("/selectedReviewDelete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(`${id}`) };
      console.log("trying to delete ", id);
      const result = await menuComments.deleteOne(query);
      res.send(result);
    });
    /*****************************[Delete ends]***********************************/
  } finally {
    console.log("done");
  }
})().catch((err) => console.error(err));

app.listen(port, () => {
  console.log(`server is running on ${port}`);
});
/*****************************/
