require("dotenv").config();
const tracer = require("./tracing")(); // turn on tracing

const express = require("express");
const http = require("http");
const opentelemetry = require("@opentelemetry/api");
const path = require("path");
const app = express();

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/../static/views/index.html"));
});
app.get("/favicon.png", (req, res) => {
  res.sendFile(path.join(__dirname, "/../static/pathetic-spiral-icon.png"));
});
app.get("/styles.css", (req, res) => {
  res.sendFile(path.join(__dirname, "/../static/styles.css"));
});
app.get("/sequence.js", (req, res) => {
  res.sendFile(path.join(__dirname, "/../static/views/sequence.js"));
});

app.get("/cheese", async (req, res) => {
  let cheeseName = req.query.name || oneOf("provel", "cheddar", "mozzarella", "fontina");
  let milkAnimal = req.query.milk || oneOf("sheep", "cow", "goat");

  const span = opentelemetry.trace.getSpan(opentelemetry.context.active());
  span.setAttribute("app.cheese.parameter.name", cheeseName);
  span.setAttribute("app.cheese.parameter.animal", milkAnimal);

  await sleep(100);

  const resultingCheese = { taste: "yum" , milkAnimal, cheeseName };
  res.send(JSON.stringify(resultingCheese));
});

function oneOf(...array) {
  return array[Math.floor(Math.random() * array.length)]
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    let data = "";
    http.get(url, res => {
      res.on("data", chunk => {
        data += chunk;
      });
      res.on("end", () => {
        resolve(data);
      });
      res.on("error", err => {
        reject(err);
      });
    });
  });
}
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

app.listen(process.env.PORT || 3000, () =>
  console.log("Listening on port 3000. Try: http://localhost:3000/")
);
