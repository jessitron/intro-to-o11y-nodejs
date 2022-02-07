const express = require("express");

const app = express();

app.use(express.json());

app.post("*", (req, res) => {
  console.log("received at " + req.url);
  console.log(JSON.stringify(req.body, null, 2));
  res.send("thanks\n")
}
);

const port = 3001;
app.listen(port, () =>
  console.log(`Listening on port ${port}.`)
);
