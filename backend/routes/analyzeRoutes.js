const express = require("express");

const router = express.Router();

const {
    analyzeVideo
} = require("../controllers/analyzeController");

router.get("/", (req, res) => {
    res.send("Analyze Route Working");
});

router.post("/", analyzeVideo);

module.exports = router;