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
  span.setAttribute("app.name", cheeseName);
  span.setAttribute("app.animal", milkAnimal);


  await makeRequest("http://localhost:3001/prepareMilk?animal=" + milkAnimal)
  
  await makeRequest("http://localhost:3002/curdle")

  const resultingCheese = { taste: "yum", milkAnimal, cheeseName };
  res.send(JSON.stringify(resultingCheese));
});


// run on port 3001
app.get("/prepareMilk", async (req, res) => {
  let milkAnimal = req.query.animal || "cow";

  const span = opentelemetry.trace.getSpan(opentelemetry.context.active());
  span.setAttribute("app.animal", milkAnimal);
  span.setAttribute("http.headers", JSON.stringify(req.headers));

  let heatSpan = tracer.startSpan("heat");
  heatSpan.setAttribute("app.startingTemp_F", 75);
  heatSpan.setAttribute("app.endingTemp_F", 170);
  await sleep(100);
  heatSpan.end();

  let coolSpan = tracer.startSpan("cool");
  coolSpan.setAttribute("app.startingTemp_F", 170);
  coolSpan.setAttribute("app.endingTemp_F", 90);
  await sleep(100);
  coolSpan.end();

  function addAcid(span) {
    span.setAttribute("app.acidify.culture", "bonanzocteria")
  }

  await withSpan("acidify", addAcid);

  await sleep(120); // wait 

  span.setAttribute("app.finalTemp_F", 90);

  span.setAttribute("app.pH", 6.7);
  
  const resultingMilk = { temp_F: 90 };
  res.send(JSON.stringify(resultingMilk));
})


function withSpan(spanName, activity) {
  const span = tracer.startSpan(spanName);
  const result = activity(span);
  span.end();
  return result;
}

// run on port 3002
app.get("/curdle", async (req, res) => {
  let howCurdly = req.query.degree || "high";

  const span = opentelemetry.trace.getSpan(opentelemetry.context.active());
  span.setAttribute("app.degree", howCurdly);

  async function enzyme(span) {
     span.setAttribute("app.enzyme", "rennet");
     await sleep(10);
  }

  async function cut(span) {
    span.setAttribute("app.whey_separation", "5");
    await sleep(70);
 }

  await withSpan("add enzyme", enzyme);
  await sleep(80);
  await withSpan("cut", cut)

  span.setAttribute("app.finalTemp_F", 82);

  const resultingCurds = { curdly: "so curdly" };
  res.send(JSON.stringify(resultingCurds));
})

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


const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`${process.env.SERVICE_NAME} listening on port ${port}. Try: http://localhost:${port}/`)
);
