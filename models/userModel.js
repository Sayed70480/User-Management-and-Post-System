const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/dataAssociationMiniProject");


const userSchema = new mongoose.Schema({
    username : String,
    name : String,
    age : Number,
    email : String,
    password : String,
    profilepic : {
        type : String,
        default : "defaultImage.jpg"
    },
    posts : [{
        type : mongoose.Schema.Types.ObjectId,
        ref : "post"
    }]
},
{
    timestamps : true,
});



module.exports =  mongoose.model("user", userSchema);