//jshint esversion:6
require('dotenv').config();
const express=require('express');
const ejs=require('ejs');
const bodyParser=require('body-parser');
const mongoose=require('mongoose');
const session=require("express-session");
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require("mongoose-findorcreate");
//const encrypt=require("mongoose-encryption");
// const bcrypt=require("bcrypt");
// const saltRounds=10;

const app=express();

console.log(process)

app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine','ejs');

app.use(session({
    secret:"My name is Niranjan",
    resave:false,
    saveUninitialized:false,
}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true});

const userSchema=new mongoose.Schema({
    email:String,
    password:String,
    googleId:String,
    facebookId:String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
//const secret="thisisourlittlesecret";
//userSchema.plugin(encrypt,{secret:process.env.SECRET,encrypt:['password']})

const User=mongoose.model("user",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

  //GOOGLE
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret:process.env.CLIENT_SECRET ,
    callbackURL: "http://localhost:3000/auth/google/secrets",
  },
  function(accessToken, refreshToken, profile, done) {
        

       User.findOrCreate({ googleId: profile.id }, function (err, user) {
         return done(err, user);
       });
  }
));
//FACEBOOK
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
//
app.get("/",function(req,res){
    res.render("home");
});

//GOOGLE AUTHENTICATION
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] })
  );

app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });

  //FACEBOOK AUTHENTICATION
  app.get('/auth/facebook',
  passport.authenticate('facebook')
  );

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });


app.get("/login",function(req,res){
    res.render("login");
});
app.get("/register",function(req,res){
    res.render("register");
});
app.get("/secrets",function(req,res){
    if(req.isAuthenticated()){
        res.render("secrets");
    }else{
        res.redirect("/login");
    }
  
});

app.get("/submit",function(req,res){
    if(req.isAuthenticated())
    {
        res.render("submit");
    }
    else{
        res.redirect("/login");
    }
})

app.get("/logout",function(req,res){
    req.logOut();
    res.redirect("/");
})


// app.post("/register",function(req,res){

//     bcrypt.hash(req.body.password,saltRounds,function(err,hash){
//         const newuser= new User({
//             email:req.body.username,
//             password:hash,
    
//         });
//         newuser.save(function(err){
//             if(err){
//                console.log(err);
//             }
//             else{
//                 res.render("secrets");
//             }
//         });
//     })

    
// });
// app.post("/login",function(req,res){
//     const username=req.body.username;
//     const password=req.body.password;

//     User.findOne({email:username},function(err,foundUser){
//         if(err)
//         {
//             console.log(err);
//         }
//         else{
//             if(foundUser) {
//                 bcrypt.compare(password,foundUser.password,function(err,result){
//                     if(result===true)
//                     {
//                         res.render("secrets");
//                     }
//                 });
                
//             } 
//         }
//     });
// });

app.post("/login",function(req,res){
    const user=new User({
        username:req.body.username,
        password:req.body.password
    });
    req.login(user,function(err){
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
    })
});

app.post("/register",function(req,res){
    User.register({username:req.body.username},req.body.password,function(err,user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            })
        }
    })
});

app.post("/submit",function(req,res){
    const submittedRequest=req.body.secret;
    
})

app.listen(3000,function(){
    console.log("server started");
})