var mongoose = require("mongoose");

var attractionSchema = new mongoose.Schema({
    name: String,
    image: String,
    text: String,
    time: Number,
    createdAt: {
        type: Date,
        default: Date.now
        },
    author: {
            id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            },
            username: String
    },
        comments: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Comment"
            }
            ]
});


module.exports = mongoose.model("Attraction", attractionSchema);
