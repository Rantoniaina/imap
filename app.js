var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
// var https = require("https");
// var fs = require("fs");

var app = express();

app.set("port", process.env.PORT || 3000);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/", require("./routes/web"));
app.use("/api", require("./routes/api"));

// const httpsOptions = {
//   key: fs.readFileSync("./security/key.pem"),
//   cert: fs.readFileSync("./security/cert.pem"),
// };

app.listen(app.get("port"), function () {
  console.log("Server started on port " + app.get("port"));
});

// https.createServer(httpsOptions, app).listen(app.get("port"), () => {
//   console.log("Server started on port " + app.get("port"));
// });
