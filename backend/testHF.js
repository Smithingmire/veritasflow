const axios = require("axios");

axios.get("https://api-inference.huggingface.co")
.then(res => {
    console.log("Success");
})
.catch(err => {
    console.log("Error:", err.message);
});