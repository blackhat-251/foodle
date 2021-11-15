const mongoose = require("mongoose");

const FileChunkSchema = new mongoose.Schema(
  {
    id: { type: mongoose.ObjectId, required: true, unique: true },
    content: { type: String, required: true },
  },
  { collection: "filesChunk" }
);

const model = mongoose.model("FileChunkSchema", FileChunkSchema);

module.exports = model;
