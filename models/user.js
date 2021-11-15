const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, required: false },
    assignments: [{ type: String }],
  },
  { collection: "users" }
);

const model = mongoose.model("UserSchema", UserSchema);

module.exports = model;
