'use strict';

const bodyParser = require('body-parser');
const BoardModel = require('../models').Board;
const ThreadModel = require('../models').Thread;
const ReplyModel = require('../models').Reply;

module.exports = function (app) {
  app.route('/api/threads/:board')
  .post(async (req, res) => {
    const { text, delete_password } = req.body;
    const board = req.params.board;
  
    
  
    const newThread = new ThreadModel({
      text,
      delete_password,
      replies: [],
      
    });
  
    try {
      const boardData = await BoardModel.findOne({ name: board });
  
      if (!boardData) {
        const newBoard = new BoardModel({
          name: board,
          threads: [newThread],
        });
        await newBoard.save();
      } else {
        boardData.threads.push(newThread);
        await boardData.save();
      }
  
      res.json({
        _id: newThread._id,
        text: newThread.text,
        created_on: newThread.create_on,
        bumped_on: newThread.bumped_on,
        reported: newThread.reported,
        delete_password: newThread.delete_password,
        replies: newThread.replies,
      });
    } catch (err) {
      console.log(err);
      res.status(500).send("There was an error processing your request");
    }
  })
  
  .get(async (req, res) => {
    const board = req.params.board;
  
    try {
      const boardData = await BoardModel.findOne({ name: board });
      if (!boardData) return res.json({ error: "No board with name" });
  
      const threads = boardData.threads
        .sort((a, b) => new Date(b.bumped_on) - new Date(a.bumped_on))
        .slice(0, 10)
        .map(thread => ({
          _id: thread._id,
          text: thread.text,
          created_on: thread.create_on,
          bumped_on: thread.bumped_on,
          replies: thread.replies.slice(-3).map(reply => ({
            _id: reply._id,
            text: reply.text,
            created_on: reply.create_on,
          })),
          replycount: thread.replies.length,
        }));
  
      res.json(threads);
    } catch (err) {
      console.log(err);
      res.status(500).send("There was an error processing your request");
    }
  })
  
  
  .put(async (req, res) => {
    const { thread_id } = req.body; // Use 'thread_id' as expected by the test
    const board = req.params.board;
  
    try {
      // Find the board by name
      const boardData = await BoardModel.findOne({ name: board });
      if (!boardData) return res.json({ error: "Board not found" });
  
      // Find the thread by ID
      const thread = boardData.threads.id(thread_id); // Match thread_id
      if (!thread) return res.json({ error: "Thread not found" });
  
      // Mark the thread as reported
      thread.reported = true;
  
      // Save changes to the database
      await boardData.save();
  
      // Return the required response
      res.send("reported");
    } catch (err) {
      console.log(err);
      res.status(500).send("There was an error processing your request");
    }
  })
  
  
    
    .delete(async (req, res) => {
      const { thread_id, delete_password } = req.body;
      const board = req.params.board;
    
      try {
        const boardData = await BoardModel.findOne({ name: board }); // Find the board
        if (!boardData) return res.json({ error: "Board not found" });
    
        const thread = boardData.threads.id(thread_id); // Find the thread by ID
        if (!thread) return res.status(404).send("Thread not found");
    
        if (thread.delete_password === delete_password) { // Validate delete_password
          boardData.threads.pull(thread_id); // Remove the thread
          await boardData.save(); // Save changes to the database
          res.send("success"); // Return the required response
        } else {
          res.send("incorrect password"); // Incorrect password response
        }
      } catch (err) {
        console.log(err);
        res.status(500).send("There was an error processing your request");
      }
    });
    

  app.route('/api/replies/:board')
  .post(async (req, res) => {
    const { thread_id, text, delete_password } = req.body;
    const board = req.params.board;
  
    const currentTimestamp = new Date();
  
    const newReply = new ReplyModel({
      text: text,
      delete_password: delete_password,
      created_on: currentTimestamp, // Ensure this is explicitly set
    reported: false,
    });
  
    try {
      const boardData = await BoardModel.findOne({ name: board });
      if (!boardData) return res.json({ error: "Board not found" });
  
      const thread = boardData.threads.id(thread_id);
      if (!thread) return res.json({ error: "Thread not found" });

      
  
      thread.bumped_on = currentTimestamp;
      thread.replies.push(newReply);
  
      await boardData.save();
  
      res.json({
        _id: thread._id,
        text: thread.text,
        created_on: thread.create_on,
        bumped_on: thread.bumped_on,
        reported: thread.reported,
     
        replies: thread.replies.map(reply => ({
          _id: reply._id,
          text: reply.text,
          created_on: reply.create_on,
          delete_password: reply.delete_password, // Explicitly include required fields
          reported: reply.reported, // Explicitly include required fields
        
        })),
        replycount: thread.replies.length,
      });
    } catch (err) {
      console.log(err);
      res.status(500).send("There was an error processing your request");
    }
  })
  
    .get(async (req, res) => {
      const board = req.params.board;

      try {
        const boardData = await BoardModel.findOne({ name: board });
        if (!boardData) return res.json({ error: "No board with this name" });

        const thread = boardData.threads.id(req.query.thread_id);
        if (!thread) return res.json({ error: "Thread not found" });

        res.json({
          _id: thread._id,
          text: thread.text,
          created_on: thread.create_on,
          bumped_on: thread.bumped_on,
          replies: thread.replies.map(reply => ({
            _id: reply._id,
            text: reply.text,
            created_on: reply.create_on,
          })),
        });
      } catch (err) {
        console.log(err);
        res.status(500).send("There was an error processing your request");
      }
    })
    .put(async (req, res) => {
      const { thread_id, reply_id } = req.body; // Use thread_id and reply_id as expected by the test
      const board = req.params.board;
    
      try {
        // Find the board by name
        const boardData = await BoardModel.findOne({ name: board });
        if (!boardData) return res.json({ error: "No board with this name" });
    
        // Find the thread by ID
        const thread = boardData.threads.id(thread_id);
        if (!thread) return res.json({ error: "Thread not found" });
    
        // Find the reply by ID within the thread
        const reply = thread.replies.id(reply_id);
        if (!reply) return res.json({ error: "Reply not found" });
    
        // Mark the reply as reported
        reply.reported = true;
    
        // Save changes to the database
        await boardData.save();
    
        // Return the required response
        res.send("reported");
      } catch (err) {
        console.log(err);
        res.status(500).send("There was an error processing your request");
      }
    })
    
    
    .delete(async (req, res) => {
      const { thread_id, reply_id, delete_password } = req.body;
      const board = req.params.board;
    
      try {
        // Find the board by name
        const boardData = await BoardModel.findOne({ name: board });
        if (!boardData) return res.json({ error: "No board with this name" });
    
        // Find the thread by thread_id
        const thread = boardData.threads.id(thread_id);
        if (!thread) return res.json({ error: "Thread not found" });
    
        // Find the reply by reply_id within the thread
        const reply = thread.replies.id(reply_id);
        if (!reply) return res.json({ error: "Reply not found" });
    
        // Validate the delete_password
        if (reply.delete_password === delete_password) {
          reply.text = "[deleted]"; // Change the reply's text to "[deleted]"
          await boardData.save(); // Save changes to the database
          res.send("success"); // Return the required response
        } else {
          res.send("incorrect password"); // Incorrect password response
        }
      } catch (err) {
        console.log(err);
        res.status(500).send("There was an error processing your request");
      }
    });
    
};
