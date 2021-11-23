var express = require("express");
var router = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const FileData = require("../models/file_data");
const Assign = require("../models/assignment");
const Course = require("../models/course");

const math = require("mathjs");
const { identityDependencies } = require("mathjs");
const uri = process.env.uri;
const sendmail = require("../services/mailer");

mongoose.connect(uri);

router.get("/", (req, res) => {
  res.redirect("/instructor/profile");
});
router.get("/profile", (req, res) => {
  return res.render("instructor/profile", { user: req.user });
});

router.all("/create_assignment", async (req, res) => {
  if (req.method == "GET") {
    return res.render("instructor/create_assgn", { user: req.user });
  }
  try {
    const code = math.randomInt(1000);
    const response = await Assign.create({
      author: req.user.username,
      title: req.body.title,
      description: req.body.description,
      assigncode: code,
    });
    console.log("Assignment created ", response);

    req.user.assignments.push(code);
    await req.user.save();
  } catch (error) {
    console.log(error);
    return res.send("Some error occured, please try again.");
  }
  res.redirect("/instructor/assignment");
});

router.all("/create_course", async (req, res) => {
  if (req.method == "GET") {
    return res.render("instructor/create_course", { user: req.user });
  }
  try {
    const code = math.randomInt(1000);
    const response = await Course.create({
      creator: req.user.username,
      name: req.body.name,
      description: req.body.description,
      coursecode: code,
    });
    console.log("Course created ", response);
    req.user.courses.push(code);
    await req.user.save();
  } catch (error) {
    console.log(error);
    return res.send("Some error occured, please try again.");
  }
  res.redirect("/instructor/");
  
  
});

router.get("/assignment", async (req, res) => {
  var assigncodes = req.user.assignments;
  if (!assigncodes) {
    return res.redirect("/instructor/create_assignment");
  }
  var assignments = [];
  for (var i = 0; i < assigncodes.length; i++) {
    var assgn = await Assign.findOne({ assigncode: assigncodes[i] });
    assignments.push(assgn);
  }

  return res.render("instructor/assignment", {
    a: assignments,
    user: req.user,
  });
});

router.get("/view_submission/:code", async (req, res) => {
  if (!req.user.assignments.includes(req.params.code)) {
    return res.send("User Not Authorized");
  }
  const f = await FileData.find({ assigncode: req.params.code });
  console.log(f);
  const assignment = await Assign.findOne({ assigncode: req.params.code });
  return res.render("instructor/view_submission", {
    user: req.user,
    files: f,
    assignment: assignment,
  });
});

router.post("/feedback/:id", async (req, res) => {
  const id = req.params.id;
  const feedback = req.body.feedback;
  const f = await FileData.findOne({ _id: id });
  f.feedback = feedback;
  await f.save();
  res.send("feedback recieved");
});

router.get("/inviteall/:code", async (req, res) => {
  if (!req.user.assignments.includes(req.params.code)) {
    return res.send("User Not Authorized");
  }
  const students = await User.find({ role: "student" });

  students.forEach(async (student) => {
    let maildetails = {
      from: process.env.email,
      to: student.email,
      subject: "Invitation link for a course",
      text: `Hi ${student.name}! \nClick http://localhost:3000/student/enroll/${req.params.code} to get enrolled into the course`,
    };

    await sendmail(maildetails);
  });
  return res.send("Successfully mailed to all");
});

module.exports = router;
