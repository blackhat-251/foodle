const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    content: { type: String, required: true, unique: false },
    sender: { type: String, required: true },
    receiver: { type: String, required: false },
    time: { type: Date, default: Date.now },
  },
  { collection: "msg", timestamps: true }
);

const model = mongoose.model("MessageSchema", MessageSchema);

module.exports = model;
