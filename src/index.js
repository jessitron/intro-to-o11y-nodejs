require("dotenv").config();
const tracer = require("./tracing")(); // turn on tracing

const express = require("express");
const http = require("http");
const otel = require("@opentelemetry/api");
const path = require("path");
const app = express();

function log(msg) {
  console.log(`${Date.now()} ${msg}`);
}

// log each incoming request.
app.use((req, res, next) => {
  log(`${req.method} ${req.url}`);
  next();
})

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
  log("Handling /fib");
  const index = parseInt(req.query.index);

  // uncomment 2 lines to add a custom attribute:
  // const span = otel.trace.getSpan(otel.context.active());
  // span.setAttribute("parameter.index", index);

  let returnValue = 0;
  if (index === 0) {
    returnValue = 0;
  } else if (index === 1) {
    returnValue = 1;
  } else {
    let minusOnePromise = makeRequest(
      `http://127.0.0.1:3000/fib?index=${index - 1}`
    );
    let minusTwoPromise = makeRequest(
      `http://127.0.0.1:3000/fib?index=${index - 2}`
    );
    const [minusOneResponse, minusTwoResponse] = await Promise.all([minusOnePromise, minusTwoPromise]);
    let minusOneParsedResponse = JSON.parse(minusOneResponse);
    let minusTwoParsedResponse = JSON.parse(minusTwoResponse);
    returnValue = calculateFibonacciNumber(minusOneParsedResponse.fibonacciNumber,
      minusTwoParsedResponse.fibonacciNumber);
  }

  // span.setAttribute("app.seqofnum.result.fibonacciNumber", returnValue);
  const returnObject = { fibonacciNumber: returnValue, index: index }
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
    log(`HTTP GET: url=${url}`)
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
