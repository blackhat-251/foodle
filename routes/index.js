var express = require("express");
var zipstream = require('zip-stream');
var csv_creator = require('../services/submit-csv')
var router = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const asynci = require('async');
const FileChunk = require("../models/file_chunk");
const uri = process.env.uri;
const JWT_SECRET = process.env.JWT_SECRET;
const FileData = require("../models/file_data");
const Assign = require("../models/assignment");
const Message = require("../models/message");
const Course = require("../models/course");
const { trueDependencies } = require("mathjs");

mongoose.connect(uri);

/* GET home page. */
router.get("/", function (req, res, next) {
  res.redirect("login");
});

router.all("/login", async (req, res) => {
  if (req.method == "GET") {
    return res.render("login");
  } else if (req.method == "POST") {
    const username = req.body.username;
    const password = req.body.password;
    if (!username || typeof username !== "string") {
      req.flash("error", "Empty username")
      return res.redirect("/login");
    }

    const user = await User.findOne({ username }).lean();

    if (!user) {
      req.flash("error", "No such user exists")
      return res.redirect("/login");
    }

    if (await bcrypt.compare(password, user.password)) {
      const token = jwt.sign(
        {
          id: user._id,
          username: user.username,
        },
        JWT_SECRET
      );

      res.cookie("jwt", token, {
        httpOnly: true,
        secure: false,
        maxAge: 3600000,
      });
      console.log("Succesfully logged in");
      if (user.role == "instructor") return res.redirect("/instructor/profile");
      return res.redirect("/student/profile");
    } else {
      req.flash("error", "Invalid credentials")
      return res.redirect("/login");
    }
  } else {
    return res.status(405).send("Method not allowed");
  }
});

router.all("/register", async (req, res) => {
  if (req.method == "GET") {
    return res.render("reg");
  } else if (req.method == "POST") {
    const email = req.body.email;
    const username = req.body.username;
    const password = await bcrypt.hash(req.body.password, 10);
    const name = req.body.name;
    const role = req.body.role;
    if (!username || typeof username !== "string") {
      req.flash("error", "Empty username")
      return res.redirect("/register");
    }
    try {
      var user = new User();
      user.username = username;
      user.password = password;
      user.role = role;
      user.email = email;
      user.name = name;
      await user.save((err, result) => {
        if (err) {
          console.log(err);
          if (err.code === 11000) {
            req.flash("error", "Username already exists")
            return res.redirect("/register");
          }
        }
        else {
          req.flash("success", "User created successfully")
          return res.redirect("/login");
        }
      });
      console.log("User created successfully ");

    } catch (error) {
      // if (error.code === 11000) {
      //   req.flash("error", "Username already exists")
      //   return res.redirect("/register");
      // }
      console.log(error)
    }
  } else {
    return res.status(405).send("Method not allowed");
  }
});

router.post("/update_password", async (req, res) => {
  if (!(await bcrypt.compare(req.body.old_pwd, req.user.password))) {
    req.flash("error", "Your current password didnt match")
    return res.redirect("/update_password");
  }
  const password = await bcrypt.hash(req.body.new_pwd, 10);
  if ((await bcrypt.compare(req.body.old_pwd, password))) {
    req.flash("error", "New password same as old")
    return res.redirect("/update_password");
  }

  req.user.password = password;
  await req.user.save();
  req.flash("success", "Password changed successfully")
  return res.redirect("/update_password");
});

router.get("/update_password", (req, res) => {
  return res.render("update_password");
});

router.get("/logout", (req, res) => {
  res.clearCookie('jwt');
  res.clearCookie('connect.sid');
  return res.redirect("/");
});

router.get("/download/:id", async (req, res) => {
  const file = await FileChunk.findOne({ id: req.params.id });
  const filedata = await FileData.findOne({ _id: req.params.id });
  res.set("Content-Disposition", `attachment; filename="${filedata.filename}"`);
  res.send(Buffer.from(file.content, "base64"));
});

router.get("/download_all/:code", async (req, res) => {
  if(req.user.role!='instructor' || !req.user.assignments.includes(req.params.code))
  {
    return res.send("unauthorised access")
  }
  const files_data = await FileData.find({ assigncode: req.params.code });

  cb = function () { };
  res.header('Content-Type', 'application/zip');
  res.header("Content-Disposition", `attachment; filename="${req.params.code}-submissions.zip"`);
  var zip = zipstream({ level: 1 });
  zip.pipe(res); // res is a writable stream

  csv_data = csv_creator(files_data)
  console.log(csv_data)
  var addFile = function (file, cb) {
    zip.entry(file.content, { name: file.name }, cb);
  };
  var files = []
  for (const file_data of files_data) {
    const file = await FileChunk.findOne({ id: file_data._id })
    files.push({ content: Buffer.from(file.content, "base64"), name: file_data.username + '-' + file_data.filename })
  }
  files.push({ content: csv_data, name: `grading-${req.params.code}.csv` })

  asynci.forEachSeries(files, addFile, function (err) {
    if (err) return cb(err);
    zip.finalize();
    cb(null, zip.getBytesWritten());
  });

})

router.post("/editprofile", async (req, res) => {
  const newname = req.body.name;
  const newmail = req.body.email;
  req.user.name = newname;
  req.user.email = newmail;
  await req.user.save();
  req.flash("success", "Profile edited successfully")
  return res.redirect("/editprofile");
});

router.get("/editprofile", (req, res) => {
  return res.render("editprofile", { user: req.user });
});

router.post("/upload/:code", async (req, res) => {
  if (req.user.role == "instructor") {
    return res.send("unauthorized access");
  }
  const file = req.files.file;
  try {
    const old_submission = await FileData.findOne({
      username: req.user.username,
      assigncode: req.params.code,
    });
    const id = old_submission._id;
    old_submission.remove().exec();
    const old_chunk = await FileChunk.findOneAndDelete({ id: id });
    const old_submission1 = await FileData.findOneAndDelete({
      username: req.user.username,
      assigncode: req.params.code,
    });
  } catch (err) {
    console.log(err);
  }

  const response = await FileData.create({
    filename: file.name,
    username: req.user.username,
    feedback: "",
    assigncode: req.params.code,
  });

  const id = response._id;

  const upload = await FileChunk.create({
    id: id,
    content: file.data.toString("base64"),
  });

  console.log("File uploaded");
  const ass =await Assign.findOne({assigncode : req.params.code})

  return res.redirect(`back`);
});

router.post("/uploadcsv/:code", async (req, res) => {
  if (req.user.role == "student") {
    return res.send("unauthorized access");
  }
  const file = req.files.file;
  var file_lines = file.data.toString().split('\n')
  for(let i=1;i<file_lines.length-1;i++){
    var line = file_lines[i].split(',')
    const username = line[1]
    const assigncode = req.params.code
    const feedback = line[3]
    const grade = line[4]
    const file_data = await FileData.findOne({username: username, assigncode:assigncode})
    file_data.feedback = feedback
    file_data.grade = grade
    await file_data.save()
  }
  console.log(file_lines)
  console.log(file.data.toString())
  console.log(file)
  const ass =await Assign.findOne({assigncode : req.params.code})
  return res.redirect(`/instructor/assignments/${ass.coursecode}`)
});

// start of the chat routes
router.get("/chat/:username", async (req,res) =>{
  const chatWith = await User.findOne({'username':req.params.username});

  if(!chatWith){
    return res.send("No such user exists with the provided username.");
  }

  const messages = await Message.find({$or:[
    {$and:[{'sender':req.user.username},{'receiver':req.params.username},{'isGroupMsg':false}]},
    {$and:[{'sender':req.params.username},{'receiver':req.user.username},{'isGroupMsg':false}]},
  ]})

  return res.render("chat",{'msgs':messages, 'chatWith':chatWith, 'user':req.user})
})

router.post("/chat/sendmsg/:username", async (req, res)=>{
  const chatWith = await User.findOne({'username':req.params.username});

  if(!chatWith){
    return res.send("No such user exists with the provided username.");
  }

  const response = await Message.create({
    content : req.body.content,
    isGroupMsg : false,
    sender : req.user.username,
    receiver : chatWith.username
  });

  console.log("Message sent", response);
  return res.send("OK")
})

router.post("/chat/getmsg/:username", async (req,res)=>{
  const n = parseInt(req.body.n);
  const msgs = await Message.find({$and:[{'sender':req.params.username},{'receiver':req.user.username},{'isGroupMsg':false}]}).sort({'time':-1}).limit(n);

  return res.json(msgs);
})

router.get("/chat/noofmsgs/:username", async (req,res)=>{
  // sends the number of messages sent by the sender
  const number = await Message.countDocuments({$and:[{'sender':req.params.username},{'receiver':req.user.username},{'isGroupMsg':false}]});
  return res.send(`${number}`);
})

// end of the chat routes

// start of the forum routes
router.get("/forum/:coursecode", async (req,res) =>{
  if(!req.user.courses.includes(req.params.coursecode)){
    return res.send("You are not part of that course");
  }

  const course = await Course.findOne({'coursecode':req.params.coursecode});

  if(!course){
    return res.send("Course doesn't exist");
  }

  const messages = await Message.find({$and:[
    {'isGroupMsg':true},{'receiver':course.coursecode}
  ]})

  return res.render("forum",{'msgs':messages, 'course':course, 'user':req.user})
})

router.post("/forum/sendmsg/:coursecode", async (req, res)=>{
  if(!req.user.courses.includes(req.params.coursecode)){
    return res.send("You are not part of that course");
  }
  
  const course = await Course.findOne({'coursecode':req.params.coursecode});

  if(!course){
    return res.send("Course doesn't exist");
  }

  const response = await Message.create({
    content : req.body.content,
    isGroupMsg : true,
    sender : req.user.username,
    receiver : course.coursecode
  });

  return res.send("OK")
})

router.post("/forum/getmsg/:coursecode", async (req,res)=>{
  if(!req.user.courses.includes(req.params.coursecode)){
    return res.send("You are not part of that course");
  }

  const n = parseInt(req.body.n);
  const msgs = await Message.find({$and:[{'isGroupMsg':true},{'receiver':req.params.coursecode}]}).sort({'time':-1}).limit(n);

  return res.json(msgs);
})

router.get("/forum/noofmsgs/:coursecode", async (req,res)=>{
  if(!req.user.courses.includes(req.params.coursecode)){
    return res.send("You are not part of that course");
  }

  // sends the number of messages sent by the sender
  const number = await Message.countDocuments({$and:[{'isGroupMsg':true},{'receiver':req.params.coursecode},{'sender':{$ne:req.user.username}}]});
  return res.send(`${number}`);
})

// end of chat routes


module.exports = router;
