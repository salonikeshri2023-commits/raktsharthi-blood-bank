const express = require("express");
const router = express.Router();


// index-users
router.get("/",(req,res)=>{
    res.send("GET for users");
})

// Show-users
router.get("/:id",(req,res)=>{
    res.send("GET for users id");
})


// Create - user
router.post("/", (req, res) => {
    res.send("POST for users");
});

// Delete-users
router.get("/:id",(req,res)=>{
    res.send("DELETE for users");
})


module.exports = router;