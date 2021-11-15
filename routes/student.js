var express = require("express");
var router = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const uri = process.env.uri;
const FileData = require("../models/file_data");
const Assign = require("../models/assignment");

mongoose.connect(uri);
router.get("/", (req, res) => {
  res.redirect("/student/profile");
});
router.get("/profile", (req, res) => {
    return res.render("student/profile", { user: req.user });
});

router.get("/view_submission", async (req, res) => {
  const f = await FileData.find({ username: req.user.username });
  const assignment = await Assign.find();
  const filtered_ass = assignment.filter((ass) => {
    return req.user.assignments.includes(ass.assigncode);
  });
  res.render("student/view_submission", {
    files: f,
    user: req.user,
    assignments: filtered_ass,
  });
});

router.get("/enroll", (req, res) => {
  res.render("student/enroll", { user: req.user });
});

router.post("/enroll", async (req, res) => {
  const assign_code = req.body.assign;
  console.log(assign_code);
  const assignment = await Assign.findOne({ assigncode: assign_code });
  console.log(assignment);
  if (!assignment) {
    return res.send("No such assignment");
  }
  if (req.user.assignments.includes(assign_code)) {
    return res.send("Already Enrolled");
  }
  req.user.assignments.push(assign_code);
  await req.user.save();
  return res.redirect("/student/assignments");
});

router.get("/enroll/:code", async (req, res) => {
  const assign_code = req.params.code;
  console.log(assign_code);
  const assignment = await Assign.findOne({ assigncode: assign_code });
  console.log(assignment);
  if (!assignment) {
    return res.send("No such assignment");
  }
  if (req.user.assignments.includes(assign_code)) {
    return res.send("Already Enrolled");
  }
  req.user.assignments.push(assign_code);
  await req.user.save();
  return res.redirect("/student/assignments");
});

router.get("/assignments", async (req, res) => {
  const assignment = await Assign.find();
  const filtered_ass = await assignment.filter((ass) => {
    return req.user.assignments.includes(ass.assigncode);
  });
  const f = await FileData.find({ username: req.user.username });
  res.render("student/assignment", {
    user: req.user,
    assignments: filtered_ass,
    files: f,
  });
});

router.post("/assignments", async (req, res) => {
  const assignment = await Assign.find();
  const filtered_ass = await assignment.filter((ass) => {
    return req.user.assignments.includes(ass.assigncode);
  });
  res.redirect("/student/assignment");
});

module.exports = router;
