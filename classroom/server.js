const express = require("express");
const app = express();
const users = require("./routes/user.js");
const post = require("./routes/post.js");
const flash = require("connect-flash");
const path = require("path");


app.set("view engine",'ejs');
app.set("views",path.join(__dirname,"views"));


// const cookieParser = require("cookie-parser");//part-1


// part1
// app.use(cookieParser("secretcode"));


// app.get("/getsignedcookies",(req,res)=>{
//     res.cookie("made-in","India",{signed:true});
//     res.send("signed cookie sent");
// })

// app.get("/verify",(req,res)=>{
//     console.log(req.signedCookies);
//     res.send("verified");
// })

// app.get("/getcookies",(req,res)=>{
//     res.cookie("greet","namaste");
//     res.cookie("origin","India");
//     res.send("sent you some cookies");
// })

// app.get("/",(req,res)=>{
//     console.dir(req.cookies);
//     res.send("Hi,I am root!");
// })

// app.use("/users",users);
// app.use("/posts",post)


// part2

const session = require("express-session");    // part-2

const sessionOptions={
    secret:"mysupersecretstring", 
    resave:false , 
    saveUninitialized:true
}

app.use(session(sessionOptions));
app.use(flash());

app.get("/register",(req,res)=>{
    let {name = "anonymous"} = req.query;
    req.session.name = name;
    req.flash("success","user registered successfully!");
    res.redirect("/hello");
});

app.get("/hello",(req,res)=>{
    res.locals.message = req.flash("success");
    res.render("page.ejs",{name:req.session.name});
})


// app.get("/reqcount",(req,res)=>{
//     if(req.session.count){
//         req.session.count++;
//     }else{
//         req.session.count = 1;
//     }
//     res.send(`you sent a request ${req.session.count} times`);
// })


app.get("/test", (req,res)=>{
    res.send("test successful!");
});

app.listen(3030,()=>{
    console.log("it is working and listening");
});