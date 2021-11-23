const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema(
  {
    creator: { type: String },
    coursecode: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: false },
    assignments: [{ type: String }],
    enrolled_students: [{ type: String }],
    ta_username: [{ type: String }],
    announcements: [{type: Map, of: String}],
  },
  { collection: "courses", timestamps: true }
);

const model = mongoose.model("CourseSchema", CourseSchema);

module.exports = model;