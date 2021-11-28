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
const { identityDependencies, electronMassDependencies } = require("mathjs");
const uri = process.env.uri;
const sendmail = require("../services/mailer");
const { render } = require("pug");

mongoose.connect(uri);

router.get("/", (req, res) => {
  res.redirect("/instructor/profile");
});
router.get("/profile", async (req, res) => {
  const users = await User.find();
  var x = [];
  users.forEach((obj) => {
    x.push({ name: obj.name, username: obj.username });
  });
  //console.log(x);
  return res.render("instructor/profile", {
    req: req,
    user: req.user,
    users: x,
  });
});

router.all("/create_assignment/:code", async (req, res) => {

  // check if a student accessing this route is a TA
  if(req.user.role == "student" && (!req.user.ta_courses.includes(req.params.code))){
    return res.send("Unauthorised access");
  }

  if (req.method == "GET") {
    return res.render("instructor/create_assgn", {
      user: req.user,
      coursecode: req.params.code,
    });
  }
  try {
    const asscode = math.random().toString(36).slice(2).substring(0, 5).toUpperCase();
    const response = await Assign.create({
      author: req.user.username,
      title: req.body.title,
      description: req.body.description,
      assigncode: asscode,
      coursecode: req.params.code,
      deadline: req.body.deadline,
      weightage: req.body.weightage,
    });
    console.log("Assignment created ", response);

    req.user.assignments.push(asscode);
    var course = await Course.findOne({ coursecode: req.params.code });
    course.assignments.push(asscode);

    await req.user.save();
    await course.save();
  } catch (error) {
    console.log(error);
    return res.send("Some error occured, please try again.");
  }
  res.redirect("back");
});

router.all("/create_course", async (req, res) => {
  if (req.method == "GET") {
    return res.render("instructor/create_course", { user: req.user });
  }
  var c = "";
  try {
    const code = math.random().toString(36).slice(2).substring(0, 5).toUpperCase();
    c = code;
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
  res.redirect(`/instructor/enrolled_students/${c}`);
});

router.get("/courses", async (req, res) => {
  var coursecodes = req.user.courses;
  if (!coursecodes) {
    return res.redirect("/instructor/create_course");
  }
  var courses = [];
  for (var i = 0; i < coursecodes.length; i++) {
    var course = await Course.findOne({ coursecode: coursecodes[i] });
    courses.push(course);
  }
  console.log(courses);

  return res.render("instructor/courses", {
    a: courses,
    user: req.user,
  });
});

router.get("/assignments/:code", async (req, res) => {
  var course = await Course.findOne({ coursecode: req.params.code });

  var assigncodes = course.assignments;
  if (!assigncodes) {
    return res.redirect(`/instructor/create_assignment/${req.params.code}`);
  }
  var assignments = [];
  for (var i = 0; i < assigncodes.length; i++) {
    var assgn = await Assign.findOne({ assigncode: assigncodes[i] });
    assignments.push(assgn);
  }

  return res.render("instructor/assignments", {
    a: assignments,
    user: req.user,
    coursecode: req.params.code,
    course: course
  });
});

router.get("/announcements/:code", async (req, res) => {
  var course = await Course.findOne({ coursecode: req.params.code });

  var anncodes = course.announcements;
  if (!anncodes) {
    return res.redirect(`/instructor/create_announcement/${req.params.code}`);
  }

  return res.render("instructor/announcement", {
    a: anncodes,
    user: req.user,
    coursecode: req.params.code,
    course: course,
  });
});

router.all("/create_announcement/:code", async (req, res) => {
  // check if a student accessing this route is a TA
  if(req.user.role == "student" && (!req.user.ta_courses.includes(req.params.code))){
    return res.send("Unauthorised access");
  }

  if (req.method === "GET") {
    return res.render("instructor/create_announcement", {
      user: req.user,
      coursecode: req.params.code,
    });
  }

  var course = await Course.findOne({ coursecode: req.params.code });
  course.announcements.push({
    title: req.body.title,
    body: req.body.body,
    date: new Date(),
  });
  await course.save();

  return res.redirect(`/${req.user.role}/announcements/${req.params.code}`);
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

  const assignment = await Assign.findOne({ assigncode: req.params.code });

  // check if a student accessing this route is a TA
  if(req.user.role == "student"){
    if((!req.user.ta_courses.includes(assignment.coursecode))){
      return res.send("Unauthorised access");
    }
  }else{
    if (!req.user.assignments.includes(req.params.code)) {
      return res.send("User Not Authorized");
    }
  }
    
  

  const f = await FileData.find({ assigncode: req.params.code });
  //console.log(f);
  const course = await Course.findOne({ coursecode: assignment.coursecode })
  //console.log(course)
  var marks=[];
  f.forEach((file)=>{
    if(!isNaN(file.grade)){
      marks.push(file.grade);
    }
  });
  return res.render("instructor/view_submission", {
    user: req.user,
    files: f,
    assignment: assignment,
    course: course,
    marks: marks,
  });
});

router.get("/view_grades/:coursecode", async (req, res) => {
  if (!req.user.courses.includes(req.params.coursecode)) {
    return res.send("User Not Authorized");
  }
  const assignments= await Assign.find({coursecode: req.params.coursecode})
  var marks=[];
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
    if(num==0){marks.push(0);}
    else{marks.push(sum/num);}
  }
  console.log(marks);
  const course = await Course.findOne({coursecode: req.params.coursecode})
  return res.render("instructor/view_grades", {
    user: req.user,
    course: course,
    marks: marks,
    assignments: assignments
  });
});

router.post("/feedback/:id", async (req, res) => {
  const id = req.params.id;
  const f = await FileData.findOne({ _id: id });
  const assign = await Assign.findOne({'assigncode':f.assigncode});  

  if(req.user.role == "student" && (!req.user.ta_courses.includes(assign.coursecode))){
    return res.send("Unauthorised access");
  }
  
  const feedback = req.body.feedback;
  if(feedback)
    f.feedback = feedback;
  if(req.body.grade)
    f.grade = req.body.grade;
  await f.save();
  res.send(`feedback recieved </br> <a href=${req.headers.referer}>Go Back</a>`);
});

router.get("/inviteall/:coursecode", async (req, res) => {
  if (!req.user.courses.includes(req.params.coursecode)) {
    return res.send("User Not Authorized");
  }
  const students = await User.find({ role: "student" });
  const course = await Course.findOne({ coursecode: req.params.coursecode });

  var host = req.get("host")

  students.forEach(async (student) => {
    let maildetails = {
      from: process.env.email,
      to: student.email,
      subject: `Invitation link for Course ${course.name} (${course.coursecode})`,
      text: `Hi ${student.name}! \nClick http://${host}/student/enroll/${req.params.coursecode} to get enrolled into the course `,
    };

    await sendmail(maildetails);
  });
  return res.send("Successfully mailed to all");
});

router.post("/enroll_student/:coursecode", async (req, res) => {
  const student_username = req.body.username;
  const student = await User.findOne({ username: student_username });
  if (!student) {
    res.send("No such student exists");
  }
  if (!student.courses || !student.courses.includes(req.params.coursecode)) {
    student.courses.push(req.params.coursecode);
    await student.save();
    return res.redirect(
      `/instructor/enrolled_students/${req.params.coursecode}`
    );
  }
  return res.redirect("back");
});

router.get("/enrolled_students/:coursecode", async (req, res) => {
  const users = await User.find();
  const course = await Course.findOne({ coursecode: req.params.coursecode });
  const enrolled_students = users.filter((user) => {
    return (
      user.courses.includes(req.params.coursecode) && user.role === "student"
    );
  });
  return res.render("instructor/enrolled_students", {
    user: req.user,
    students: enrolled_students,
    course: course,
  });
});

router.all("/assignta/:coursecode", async (req, res) => {
  const course = await Course.findOne({ coursecode: req.params.coursecode });
  if (req.method === "GET") {
    const tas = course.ta_username
    var ta_uname = []
    const users = await User.find();
    for (var ta of tas) {
      ta_uname.push(ta.username)
    }
    const ta_user = users.filter((user) => {
      return ta_uname.includes(user.username)
    })
    res.render('instructor/tas',
      {
        course: course,
        tas_name: ta_user,
        tas_priv: course.ta_username,
        user: req.user
      })
  }
  else {
    const username = req.body.username
    const announcement = req.body.announcement ? true : false
    const grading = req.body.grading ? true : false
    const assignment = req.body.assignment ? true : false
    
    // make sure the username is valid
    const user = (await User.findOne({'username':username}));
    if(!user){
      return res.send("Invalid username")
    }

    // make sure we can't add an instructor as a TA because it creates annoying edge cases which need fixing
    if(user.role == "instructor"){
      return res.send(`The user ${user.username} is an instructor, you can't add an instructor as a TA.`)
    }

    // remove the old ta permissions to avoid duplication
    course.ta_username = course.ta_username.filter((ta)=>{return ta.username != username});
  
    course.ta_username.push({
      username: username,
      announcement: announcement,
      grading: grading,
      assignment: assignment
    })
    await course.save()
    
    if(!user.ta_courses.includes(req.params.coursecode)){
      user.ta_courses.push(req.params.coursecode);
    }

    await user.save();

    return res.redirect('back')
  }
})

router.post("/toggle-forum/:coursecode", async (req,res) =>{
  const course = await Course.findOne({ coursecode: req.params.coursecode });
  
  if(course.creator != req.user.username){
    return "You are not an instructor of this course";
  }

  let response;
  if(req.body.action == "Enable-forum"){
    course.forumDisabled = false;
    response = "Forum enabled";
  }else{
    course.forumDisabled = true;
    response = "Forum disabled";
  }

  await course.save();

  return res.send(response);
})

router.get("/todo", async (req, res) => {
  courses = await Course.find({'creator':req.user.username});

  var assigncodes = [];
  courses.forEach((course)=>{
    course.assignments.forEach((assignment)=>{
      assigncodes.push(assignment);
    })
  })

  const f = await FileData.find({$and:[{'assigncode':{$in : assigncodes}},{'grade':{$exists : false}}]});
  const assignments = await Assign.find({'assigncode':{$in : assigncodes}});

  const pending = []
  
  assignments.forEach((assignment)=>{
    let pending_submissions = f.filter((file)=>{
                                return file.assigncode == assignment.assigncode;
                              })
    if(pending_submissions.length > 0){
      let curr_pending = [assignment.title, assignment.assigncode, pending_submissions];
      pending.push(curr_pending);
    }

  })
  return res.render("instructor/todo", {
    'user': req.user,
    'pending': pending,
  });
});


module.exports = router;
