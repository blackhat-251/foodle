var express = require("express");
var router = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const uri = process.env.uri;
const FileData = require("../models/file_data");
const Assign = require("../models/assignment");
const Course = require("../models/course");


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

// router.get("/enroll", (req, res) => {
//   res.render("student/enroll", { user: req.user });
// });
router.get("/enroll_course", (req, res) => {
  res.render("student/enroll_course", { user: req.user });
});

// router.post("/enroll", async (req, res) => {
//   const assign_code = req.body.assign;
//   console.log(assign_code);
//   const assignment = await Assign.findOne({ assigncode: assign_code });
//   console.log(assignment);
//   if (!assignment) {
//     return res.send("No such assignment");
//   }
//   if (req.user.assignments.includes(assign_code)) {
//     return res.send("Already Enrolled");
//   }
//   req.user.assignments.push(assign_code);
//   await req.user.save();
//   return res.redirect("/student/assignments");
// });

router.post("/enroll_course", async (req, res) => {
  const course_code = req.body.coursecode;
  console.log(course_code);
  const course = await Course.findOne({ coursecode: course_code });
  console.log(course);
  if (!course) {
    req.flash("error", "No such Course Exists")
    return res.redirect("/student/enroll_course");
  }
  if (req.user.courses.includes(course_code)) {
    req.flash("error", "Already Enrolled")
    return res.redirect("/student/");
  }
  req.user.courses.push(course_code);
  await req.user.save();
  course.enrolled_students.push(req.user.username)
  await course.save()
  return res.redirect("/student/courses");
});

router.get("/courses", async (req, res) => {
  courses = await Course.find()
  const filtered_course = await courses.filter((ass) => {
    return req.user.courses.includes(ass.coursecode);
  });
  return res.render("student/dashboard", {
    user: req.user,
    courses: filtered_course,
  })
})

router.get("/enroll/:coursecode", async (req, res) => {
  const course_code = req.params.coursecode;
  console.log(course_code);
  const course = await Course.findOne({ coursecode: course_code });
  console.log(course);
  if (!course) {
    req.flash("error", "No such Course Exists")
    return res.redirect("/student/enroll_course");
  }
  if (req.user.courses.includes(course_code)) {
    req.flash("error", "Already Enrolled")
    return res.redirect("/student/");
  }
  req.user.courses.push(course_code);
  await req.user.save();
  course.enrolled_students.push(req.user.username)
  await course.save()
  return res.redirect("/student/courses");
});

router.get("/assignments/:coursecode", async (req, res) => {
  const course = await Course.findOne({coursecode: req.params.coursecode})
  const assignment = await Assign.find();
  const filtered_ass = await assignment.filter((ass) => {
    return course.assignments.includes(ass.assigncode);
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

router.get("/announcements/:code", async (req, res) => {
  var course = await Course.findOne({ coursecode: req.params.code });

  var anncodes = course.announcements;

  return res.render("student/announcement", {
    a: anncodes,
    user: req.user,
    coursecode: req.params.code
  });
});


module.exports = router;