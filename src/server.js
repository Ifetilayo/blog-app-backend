import express from "express";
import fs from "fs";
import { db, connectToDb } from "./db.js";
import cors from "cors";
import admin from "firebase-admin";

const credentials = JSON.parse(fs.readFileSync("./credentials.json"));

admin.initializeApp({
  credential: admin.credential.cert(credentials),
});

const app = express();
const corsOptions = {
  origin: "http://localhost:3000",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(express.json());
app.use(cors(corsOptions));

app.use(async (req, res, next) => {
  const { authtoken } = req.headers;

  if (authtoken) {
    try {
      req.user = await admin.auth().verifyIdToken(authtoken);
    } catch (e) {
      return res.sendStatus(400);
    }
  }

  req.user = req.user || {};

  next();
});

app.get("/api/articles/:name", async (req, res) => {
  const { name } = req.params;
  const { uid } = req.user;

  const article = await db.collection("articles").findOne({ name: name });

  if (article) {
    const upvoteIds = article.upvoteIds || [];
    article.canUpvote = uid && !upvoteIds.includes(uid);

    res.json(article);
  } else res.sendStatus(404);
});

app.use((req, res, next) => {
  if (req.user) {
    next();
  } else {
    res.sendStatus(401);
  }
});

app.put("/api/articles/:name/upvote", async (req, res) => {
  const { name } = req.params;
  const { uid } = req.user;

  const article = await db.collection("articles").findOne({ name: name });

  if (article) {
    const upvoteIds = article.upvoteIds || [];
    const canUpvote = uid && !upvoteIds.includes(uid);

    if (canUpvote) {
      await db.collection("articles").updateOne(
        { name },
        {
          $inc: { upvotes: 1 },
          $push: { upvoteIds: uid },
        }
      );
    }

    const upadatedArticle = await db
      .collection("articles")
      .findOne({ name: name });
    res.json(upadatedArticle);
  } else {
    res.sendStatus(400);
  }
});

app.post("/api/articles/:name/comments", async (req, res) => {
  const { name } = req.params;
  const { email } = req.user;

  if (req.body) {
    const { text } = req.body;

    await db.collection("articles").updateOne(
      { name },
      {
        $push: { comments: { postedBy: email, text } },
      }
    );
  } else {
    res.sendStatus(400);
  }
  const article = await db.collection("articles").findOne({ name: name });

  if (article) {
    res.json(article);
  } else res.send(`${name} article doesn\'t exist`);
});

connectToDb(() =>
  app.listen(process.env.PORT || 8000, () => {
    console.log(`Go catch the server at PORT ${process.env.PORT || 8000}`);
  })
);
