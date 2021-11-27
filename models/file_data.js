const mongoose = require("mongoose");

const FileDataSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    username: { type: String, required: true },
    feedback: { type: String, required: false },
    grade: { type: Number },
    assigncode: { type: String, required: true },
  },
  { collection: "filesData", timestamps: true }
);

const model = mongoose.model("FileDataSchema", FileDataSchema);

module.exports = model;
