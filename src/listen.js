const express = require("express");

const app = express();

app.use(express.json());

app.post("/", (req, res) => {
  console.log(req.body);
  res.send("thanks\n")
}
);

const port = 3001;
app.listen(port, () =>
  console.log(`Listening on port ${port}.`)
);
