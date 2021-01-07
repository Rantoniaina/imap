var express = require("express");
var Imap = require("imap");
var inspect = require("util").inspect;

var router = express.Router();

router.get("/", function (req, res) {
  res.render("home/");
});

router.post("/signin", function (req, res) {
  var email = req.body.email;
  var password = req.body.password;
  var host = req.body.host;
  var port = req.body.port;
  var tls = req.body.tls;

  if (email && password && host && port) {
    var imap = new Imap({
      user: email,
      password,
      host,
      port,
      tls: tls ? true : false,
      tlsOptions: { rejectUnauthorized: false },
    });

    function openInbox(cb) {
      imap.openBox("INBOX", true, cb);
    }

    imap.once("ready", function () {
      openInbox(function (err, box) {
        if (err) throw err;
        var f = imap.seq.fetch("1:3", {
          bodies: "HEADER.FIELDS (FROM TO SUBJECT DATE)",
          struct: true,
        });
        f.on("message", function (msg, seqno) {
          console.log("Message #%d", seqno);
          var prefix = "(#" + seqno + ") ";
          msg.on("body", function (stream, info) {
            var buffer = "";
            stream.on("data", function (chunk) {
              buffer += chunk.toString("utf8");
            });
            stream.once("end", function () {
              console.log(
                prefix + "Parsed header: %s",
                inspect(Imap.parseHeader(buffer))
              );
            });
          });
          msg.once("attributes", function (attrs) {
            console.log(prefix + "Attributes: %s", inspect(attrs, false, 8));
          });
          msg.once("end", function () {
            console.log(prefix + "Finished");
          });
        });
        f.once("error", function (err) {
          console.log("Fetch error: " + err);
        });
        f.once("end", function () {
          console.log("Done fetching all messages!");
          imap.end();
        });
      });
    });

    imap.once("error", function (err) {
      console.log("error: " + err);
    });

    imap.once("end", function () {
      console.log("Connection ended");
    });

    imap.connect();
  }
});

module.exports = router;
