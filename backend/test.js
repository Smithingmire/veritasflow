const axios = require("axios");

axios.get("https://huggingface.co")
.then(() => console.log("Connected"))
.catch(err => console.log(err.message));