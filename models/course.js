const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema(
  {
    creator: { type: String },
    coursecode: { type: String, required: true, unique: true },
    name: { type: String, required: true, unique: true },
    description: { type: String, required: false },
    assignments: [{ type: String }],
    enrolled_students: [{ type: String }],
    ta_username: [{ type: Object }], // list of JSON {username:'str', announcement: 'bool', grading: 'bool', assignment: 'bool'}
    announcements: [{ type: Map, of: String }],
    forumDisabled: {type: Boolean}
  },
  { collection: "courses", timestamps: true }
);

const model = mongoose.model("CourseSchema", CourseSchema);

module.exports = model;
