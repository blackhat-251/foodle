const mongoose = require("mongoose");

const AssignSchema = new mongoose.Schema(
  {
    author: { type: String, required: true, unique: false },
    title: { type: String, required: true },
    description: { type: String, required: false },
    assigncode: { type: String, required: true, unique: true },
    deadline: { type: String, default: Date },
    coursecode: {type: String}
  },
  { collection: "assign", timestamps: true }
);

const model = mongoose.model("AssignSchema", AssignSchema);

module.exports = model;
