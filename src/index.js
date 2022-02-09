require("dotenv").config();
require("./tracing")(); // turn on tracing

const express = require("express");
const http = require("http");
const opentelemetry = require("@opentelemetry/api");
const BabyCache = require("./cache");
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

app.get("/fib", async (req, res) => {
  const index = parseInt(req.query.index);

  const span = opentelemetry.trace.getSpan(opentelemetry.context.active());
  span.setAttribute("app.seqofnum.parameter.index", index);

  let returnValue = 0;
  if (index === 0) {
    returnValue = 0;
  } else if (index === 1) {
    returnValue = 1;
  } else {
    let minusOneResponse = await retrieveFibonacciResponse(index - 1, fetchFibonacciResponse);
    let minusTwoResponse = await retrieveFibonacciResponse(index - 2, fetchFibonacciResponse);
    returnValue = calculateFibonacciNumber(minusOneResponse.fibonacciNumber,
      minusTwoResponse.fibonacciNumber);
  }

  span.setAttribute("app.seqofnum.result.fibonacciNumber", returnValue);
  const returnObject = { fibonacciNumber: returnValue, index: index }
  res.send(JSON.stringify(returnObject));
});

const fibonacciCache = new BabyCache();
const tracer = opentelemetry.trace.getTracer("fibonacci-cache");

/**
 * 
 * @param {number} index 
 * @param {number => Promise<Object>} onMiss 
 * @returns 
 */
async function retrieveFibonacciResponse(index, onMiss) {
  const span = tracer.startSpan("check cache");
  span.setAttribute("app.seqofnum.cache.size", fibonacciCache.size());
  if (fibonacciCache.has(index)) {
    span.setAttribute("app.seqofnum.cache.hit", true);
    const result = fibonacciCache.get(index);
    span.end();
    return result;
  } else {
    span.setAttribute("app.seqofnum.cache.hit", false);
    const fetchedResult = await onMiss(index);
    span.setAttribute("app.seqofnum.cache.addKey", index);
    fibonacciCache.set(index, fetchedResult);
    span.end();
    return fetchedResult;
  }
}

async function fetchFibonacciResponse(index) {
  const fetchedResult = await makeRequest(
    `http://127.0.0.1:3000/fib?index=${index}`
  );
  const result = JSON.parse(fetchedResult);
  return result;
}

function calculateFibonacciNumber(previous, oneBeforeThat) {
  // can you wrap this next line in a custom span?
  const result = previous + oneBeforeThat;
  return result;
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
