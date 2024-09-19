import express from "express";
import { db, connectToDb } from "./db.js";
import cors from "cors";

const app = express();
const corsOptions = {
  origin: "http://localhost:3000",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};

app.use(express.json());
app.use(cors(corsOptions));

// app.use(function (req, res, next) {
//   res.header("Access-Control-Allow-Origin", "http://localhost:3000");
//   // res.setHeader("Access-Control-Allow-Origin", "http://localhost:8000/");

//   // res.header("Access-Control-Allow-Origin", "http://localhost:3000/"); // update to match the domain you will make the request from
//   res.header(
//     "Access-Control-Allow-Headers",
//     "Origin, X-Requested-With, Content-Type, Accept"
//   );
//   next();
// });

app.get("/api/articles/:name", async (req, res) => {
  const { name } = req.params;

  const article = await db.collection("articles").findOne({ name: name });

  if (article) {
    res.json(article);
  } else res.sendStatus(404);
});

app.put("/api/articles/:name/upvote", async (req, res) => {
  const { name } = req.params;

  await db.collection("articles").updateOne(
    { name },
    {
      $inc: { upvotes: 1 },
    }
  );

  const article = await db.collection("articles").findOne({ name: name });
  if (article) {
    res.json(article);
  } else res.sendStatus(404);
});

app.post("/api/articles/:name/comments", async (req, res) => {
  const { name } = req.params;
  if (req.body) {
    const { postedBy, text } = req.body;

    await db.collection("articles").updateOne(
      { name },
      {
        $push: { comments: { postedBy, text } },
      }
    );
  } else {
    res.sendStatus(400);
  }
  const article = await db.collection("articles").findOne({ name: name });

  if (article) {
  } else res.send(`${name} article doesn\'t exist`);
});

app.listen(process.env.PORT || 8000, () => {
  console.log(`Go catch the server at PORT ${process.env.PORT || 8000}`);
});
