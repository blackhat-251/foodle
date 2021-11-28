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

router.get("/profile", async (req, res) => {
  const users = await User.find();
  var x = [];
  users.forEach((obj) => {
    x.push({ name: obj.name, username: obj.username });
  });
  // console.log(x);

  return res.render("student/profile", { user: req.user, users: x });
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

router.get("/enroll_course", (req, res) => {
  res.render("student/enroll_course", { user: req.user });
});

router.post("/enroll_course", async (req, res) => {
  const course_code = req.body.coursecode;
  console.log(course_code);
  const course = await Course.findOne({ coursecode: course_code });
  console.log(course);
  if (!course) {
    //req.flash("error", "No such Course Exists");
    return res.send("No Such Course");
  }
  if (req.user.courses.includes(course_code)) {
    //req.flash("error", "Already Enrolled");
    return res.send("Already Enrolled");
  }
  req.user.courses.push(course_code);
  await req.user.save();
  course.enrolled_students.push(req.user.username);
  await course.save();
  return res.redirect("/student/courses");
});

async function get_completion(courses, req) {
  var course_list = [];
  const f = await FileData.find({ username: req.user.username });
  var all_subs = f.map((file) => {
    return file.assigncode;
  });
  courses.forEach(function (course) {
    //Get all assignments -> Assignment count
    var ass_count = course.assignments.length;
    if (ass_count == 0) {
      course_list.push({
        course: course,
        completed: 0,
      });
      return;
    }
    //From all submissions, get count of submissions to this course
    var submissions = 0;
    all_subs.forEach(function (sub) {
      if (course.assignments.includes(sub)) {
        submissions += 1;
      }
    });
    course_list.push({
      course: course,
      completed: Math.round((submissions / ass_count) * 100),
    });
  });
  //Return Array of {course,percentage}
  return course_list;
}

router.get("/courses", async (req, res) => {
  let courses = await Course.find({$or:[{'coursecode':{$in:req.user.courses}},{'coursecode':{$in:req.user.ta_courses}}]});

  var completed_courses = await get_completion(courses, req);
  console.log(completed_courses);
  return res.render("student/dashboard", {
    user: req.user,
    courses: completed_courses,
  });
});

router.get("/enroll/:coursecode", async (req, res) => {
  const course_code = req.params.coursecode;
  console.log(course_code);
  const course = await Course.findOne({ coursecode: course_code });
  console.log(course);
  if (!course) {
    //req.flash("error", "No such Course Exists");
    return res.send("Invalid Course Code");
  }
  if (req.user.courses.includes(course_code)) {
   // req.flash("error", "Already Enrolled");
    return res.send("Already enrolled");
  }
  req.user.courses.push(course_code);
  await req.user.save();
  course.enrolled_students.push(req.user.username);
  await course.save();
  return res.redirect("/student/courses");
});

router.get("/grade/:coursecode", async(req, res) => {
  const course = await Course.findOne({ coursecode: req.params.coursecode });
  const assignments= await Assign.find({coursecode: req.params.coursecode})
  const f = await FileData.find({ username: req.user.username });
  var class_avg = 0
  for(var i=0;i<assignments.length;i++){
    const f = await FileData.find({ assigncode: assignments[i].assigncode });
    var num=0;
    var sum=0;
    f.forEach((file)=>{
      if(!isNaN(file.grade)){
        sum+=file.grade;
        num+=1;
      }
    });
    if(num>0){
    class_avg += (sum/num)*assignments[i].weightage/100
    }
  }
  // class_avg /= assignments.length
  res.render("student/grade", {
    user: req.user,
    ass: assignments,
    files: f,
    course: course,
    class_avg: class_avg,
  });
})
router.get("/assignments/:coursecode", async (req, res) => {
  const course = await Course.findOne({ coursecode: req.params.coursecode });
  const assignments = await Assign.find({'assigncode':{$in : course.assignments}});
  const f = await FileData.find({ username: req.user.username });

  var ta_perms;
  if(req.user.ta_courses.includes(course.coursecode)){
    ta_perms = course.ta_username.filter((ta)=>{return ta.username == req.user.username})[0];
  }
  
  res.render("student/assignment", {
    user: req.user,
    assignments: assignments,
    files: f,
    course: course,
    ta_perms: ta_perms
  });
});

router.get("/todo", async (req, res) => {
  courses = await Course.find();

  //Courses the student is enrolled in
  const filtered_courses = courses.filter((ass) => {
    return req.user.courses.includes(ass.coursecode);
  });

  // console.log(filtered_courses)

  //From each courses, get all the assignments
  var assigncodes = [];
  filtered_courses.forEach(function (course) {
    course.assignments.forEach(function (assignment) {
      assigncodes.push(assignment);
    });
  });

  //Get all assignments that the user has submitted, and add the ones not submitted to array to be displayed
  const f = await FileData.find({ username: req.user.username });
  var all_subs = f.map((file) => {
    return file.assigncode;
  }); //List of codes of all submitted assignments

  const all_assignments = await Assign.find();
  const todo_assignments = all_assignments.filter(function (assignment) {
    return (
      !all_subs.includes(assignment.assigncode) &&
      req.user.courses.includes(assignment.coursecode)
    ); //If the assignment has not been submitted
  });

  //Sort the array with respect to time
  todo_assignments.sort((a, b) => {
    return a.deadline - b.deadline;
  });

  return res.render("student/todo", {
    user: req.user,
    a: todo_assignments,
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

  var ta_perms;
  if(req.user.ta_courses.includes(course.coursecode)){
    ta_perms = course.ta_username.filter((ta)=>{return ta.username == req.user.username})[0];
  }

  return res.render("student/announcement", {
    a: course.announcements,
    user: req.user,
    course: course,
    ta_perms: ta_perms
  });
});

// router.get("/enroll", (req, res) => {
//   res.render("student/enroll", { user: req.user });
// });

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

module.exports = router;
