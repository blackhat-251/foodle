const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: false },
    assignments: [{ type: String }],
    courses: [{ type: String }],
    ta_courses: [{ type: String }], //Course codes for which the student is a TA
    pwdChangeToken : [{type: String}]
  },
  { collection: "users" }
);

const model = mongoose.model("UserSchema", UserSchema);

module.exports = model;
