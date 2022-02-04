require("dotenv").config();
const tracer = require("./tracing")(); // turn on tracing

const express = require("express");
const http = require("http");
const opentelemetry = require("@opentelemetry/api");
const path = require("path");
const app = express();
const { slowThing } = require("./linked");

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

app.get("/link", async (req, res) => {
  let thingName = req.query.name || "something";
  
  const span = opentelemetry.trace.getSpan(opentelemetry.context.active());
  span.setAttribute("app.thingToTrigger", thingName);

  setTimeout(() => slowThing(span.spanContext(), thingName), 5000);
  res.send("OK");
})

app.get("/fib", async (req, res) => {
  let index = parseInt(req.query.index);

  const span = opentelemetry.trace.getSpan(opentelemetry.context.active());
  span.setAttribute("app.seqofnum.parameter.index", index);

  let returnValue = 0;
  if (index === 0) {
    returnValue = 0;
  } else if (index === 1) {
    returnValue = 1;
  } else {
    let minusOneResponse = await makeRequest(
      `http://127.0.0.1:3000/fib?index=${index - 1}`
    );
    let minusOneParsedResponse = JSON.parse(minusOneResponse);
    let minusTwoReturn = JSON.parse(await makeRequest(
      `http://127.0.0.1:3000/fib?index=${index - 2}`
    ));
    // let span = tracer.startSpan("calculation");
    returnValue = calculateFibonacciNumber(minusOneParsedResponse.fibonacciNumber,
                                           minusTwoReturn.fibonacciNumber);
    // span.end();
  }
  const returnObject = { fibonacciNumber: returnValue, index: index }
  // maybe add the return value as a custom attribute too?
  res.send(JSON.stringify(returnObject));
});

function calculateFibonacciNumber(previous, oneBeforeThat) {
 // can you wrap this next line in a custom span?
  const result = previous + oneBeforeThat;
  return previous + oneBeforeThat;
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

app.listen(process.env.PORT || 3000, () =>
  console.log("Listening on port 3000. Try: http://localhost:3000/")
);
