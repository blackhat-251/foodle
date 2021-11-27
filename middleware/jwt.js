const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;
const User = require("../models/user");
var format = require("util").format;
var isArray = require("util").isArray;

async function jwt_verify(req, res, next) {
  //res.locals.message = { "error": "","success":"" }
  //req.flash = _flash
  const exceptions = ["/login", "/register"];
  if (exceptions.includes(req.path)) {
    return next();
  }
  try {
    var token = req.headers.cookie;
    if (!token) {
      return res.redirect("/login");
    }
    token = token.split("jwt=")[1];
    if (!token) {
      return res.redirect("/login");
    }
    await jwt.verify(token, JWT_SECRET, async (err, verifiedJwt) => {
      if (err) {
        return res.redirect("/login");
      } else {
        const username = verifiedJwt["username"];
        req.user = await User.findOne({ username });
      }
    });
  } catch (e) {
    console.log(e);
    return res.redirect("/login");
  }
  //console.log(req.user);
  if (req.user) {
    if (req.path.includes("/student") && req.user.role === "instructor") {
      return res.send("Unauthorized access");
    }

    if (req.path.includes("/instructor")) {
      // giving access to some routes as a student for the TAs
      if(!(req.path.includes("/instructor/create_announcement/") || req.path.includes("/instructor/view_submission/") || req.path.includes("/instructor/create_assignment/") || req.path.includes("/instructor/feedback/"))){
        if(req.user.role === "student"){
          return res.send("Unauthorized access");
        }
      }
    }
  }

  return next();
}

module.exports = jwt_verify;
