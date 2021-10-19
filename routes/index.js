var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const jwt  = require('jsonwebtoken');
const FileChunk = require('../models/file_chunk');
const uri = process.env.uri;
const JWT_SECRET = process.env.JWT_SECRET;
const FileData = require('../models/file_data');
mongoose.connect(uri);

/* GET home page. */
router.get('/', function(req, res, next) {
  res.redirect('login');
});

router.all("/login", async (req,res)=>{

  if(req.method == "GET"){
      return res.render("login");
  }
  else if(req.method == "POST")
  {
      const username = req.body.username;
      const password = req.body.password;
      if(!username || typeof username !== 'string')
      {
          return res.send("Empty username");
      }

      const user = await User.findOne({username}).lean();

      if(!user){
          return res.send("No such user exists");
      }

      if(await bcrypt.compare(password,user.password)){
          const token = jwt.sign(
              {
                  id: user._id,
                  username: user.username
              },
              JWT_SECRET
          )

          res.cookie('jwt',token, { httpOnly: true, secure: false, maxAge: 3600000 });
          console.log("Succesfully logged in");
          if(user.role == 'instructor')
            return res.redirect("/instructor/profile");
          return res.redirect("/student/profile");
      }else{
          return res.send("Invalid credentials");
      }
      
  }else{
      return res.status(405).send("Method not allowed");
  }
})

router.all("/register",async (req,res)=>{
  if(req.method == "GET"){
      return res.render("reg");
  }else if(req.method == "POST"){
      const email = req.body.email;
      const username = req.body.username;
      const password = await bcrypt.hash(req.body.password,10);
      const name = req.body.name;
      const role = req.body.role;
      if(!username || typeof username !== 'string'){
          return res.send("Empty username");
      }
      try{
          var user = new User();
          user.username = username;
          user.password = password;
          user.role = role;
          user.email = email;
          user.name = name;
          await user.save((e,u)=>{console.log(e,u)});
          console.log("User created successfully ");
          return res.redirect("/login");
      }catch(error){
          if (error.code === 11000){
              return res.send("Username already exists");
          }
      }

  }else{
      return res.status(405).send("Method not allowed");
  }
})

router.post("/update_password",async (req,res)=>{
  if(!await bcrypt.compare(req.body.old_pwd,req.user.password)){
      return res.send("Your current password didnt match");
  }
  const password = await bcrypt.hash(req.body.new_pwd,10);
  req.user.password = password;
  await req.user.save();
  return res.send("Password changed successfully");
})

router.get("/update_password", (req,res)=>{
  return res.render("update_password");
})

router.get("/logout",  (req,res)=>{
  res.clearCookie('jwt');
  return res.redirect("/");
})

router.get("/download/:id", async (req,res)=>{
  const file = await FileChunk.findOne({id : req.params.id});
  const filedata = await FileData.findOne({_id: req.params.id});
  res.set('Content-Disposition',`attachment; filename="${filedata.filename}"`);
  res.send(Buffer.from(file.content,'base64'));
})

router.post("/editprofile", async(req, res)=>{
  const newname = req.body.name
  const newmail = req.body.email
  req.user.name = newname
  req.user.email = newmail
  await req.user.save()
  return res.send("profile updated successfully")

})

router.get("/editprofile", (req,res)=>{
  return res.render("editprofile",{user: req.user})
})

router.post("/upload/:code", async (req, res) => {
  if(req.user.role == 'instructor')
  {
    return res.send("unauthorized access")
  }
  const file = req.files.file;
  try{
    const old_submission = await FileData.findOne({username: req.user.username,  assigncode: req.params.code})
    const id = old_submission._id
    old_submission.remove().exec()
    const old_chunk = await FileChunk.findOneAndDelete({id: id})
    const old_submission1 = await FileData.findOneAndDelete({username: req.user.username,  assigncode: req.params.code})
  }
  catch(err){console.log(err)}

    const response = await FileData.create({
        filename:file.name,
        username: req.user.username,
        feedback: "",
        assigncode: req.params.code
    });

    const id = response._id;

    const upload = await FileChunk.create({
      id: id,
      content:file.data.toString('base64'),
    })


    console.log("File uploaded");

    return res.redirect("/student/assignments");


});



module.exports = router;
