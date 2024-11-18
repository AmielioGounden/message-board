const mongoose = require('mongoose');
const { Schema } = mongoose;
const date = new Date();

const ReplySchema = new Schema ({
text: {type: String},
delete_password: {type: String},
create_on: {type: Date, default: Date.now },  
bumped_on: {type: Date, default: Date.now },  
reported: {type: Boolean, default: false},
});
const Reply = mongoose.model("Reply", ReplySchema);

const ThreadSchema = new Schema({
    text: { type: String, required: true },
    delete_password: { type: String, required: true },
    reported: { type: Boolean, default: false },
    create_on: { type: Date, default: Date.now },
    bumped_on: { type: Date, default: Date.now },
    replies: { type: [ReplySchema], default: [] },
  });

const Thread = mongoose.model("Thread", ThreadSchema);

const BoardSchema = new Schema({    
name: {type: String},
threads: {type: [ThreadSchema]},
});


const Board = mongoose.model("Board", BoardSchema);

exports.Board = Board;
exports.Thread = Thread;
exports.Reply = Reply;