var express = require("express");
var Imap = require("imap");
// var inspect = require("util").inspect;
var url = require("url");

var router = express.Router();

router.get("/", function (req, res) {
  res.render("home/", {
    info: req.query.info,
    error: req.query.error,
  });
});

router.post("/signin", function (req, res) {
  var email = req.body.email;
  var password = req.body.password;
  var host = req.body.host;
  var port = req.body.port;
  var tls = req.body.tls;

  if (email && password && host && port) {
    var result = [];

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
              result.push(chunk.toString("utf8"));
            });
            stream.once("end", function () {
              //   result.push(inspect(Imap.parseHeader(buffer)));
              //   console.log(
              //     prefix + "Parsed header: %s",
              //     inspect(Imap.parseHeader(buffer))
              //   );
            });
          });
          //   msg.once("attributes", function (attrs) {
          //     console.log(prefix + "Attributes: %s", inspect(attrs, false, 8));
          //   });
          msg.once("end", function () {
            console.log(prefix + "Finished");
          });
        });
        f.once("error", function (err) {
            console.log('err1', err);
          return res.redirect(
            url.format({
              pathname: "/",
              query: {
                error: err.toString(),
              },
            })
          );
        });
        f.once("end", function () {
          imap.end();
          if (result.length > 0) {
            return res.redirect(
              url.format({
                pathname: "/mails",
                query: {
                  mails: result,
                },
              })
            );
          }
          if (result.length === 0) {
            return res.redirect(
              url.format({
                pathname: "/",
                query: {
                  info: "No mail in mailbox",
                },
              })
            );
          }
        });
      });
    });

    imap.once("error", function (err) {
      return res.redirect(
        url.format({
          pathname: "/",
          query: {
            error: err.toString(),
          },
        })
      );
    });

    imap.once("end", function () {
      console.log("Connection ended");
    });

    imap.connect();
  }
});

router.get("/mails", function (req, res) {
  res.render("mails/", {
    data: req.query.mails,
  });
});

module.exports = router;
