var express = require("express");
var url = require("url");
var router = express.Router();

/* GET splash screen. */
router.get("/", function(req, res) {
  res.sendFile("splash.html", { root: "./public" });
});

/* GET game screen. */
router.get("/play", function(req, res) {
  // Get playername
  // How to also send the playername along with the file?
  res.sendFile("game.html", { root: "./public" });
});

module.exports = router;
