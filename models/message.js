const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    content: { type: String, required: true, unique: false },
    isGroupMsg :{type: Boolean, required: true},
    sender: { type: String, required: true },
    receiver: { type: String, required: false },
    time: { type: String, required: false},
  },
  { collection: "msg", timestamps: true }
);

const model = mongoose.model("MessageSchema", MessageSchema);

module.exports = model;
