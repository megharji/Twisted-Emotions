const mongoose = require("mongoose");

const  motivationModel = new mongoose.Schema(
    {   
        title: String,
        quote : String,
        categories: {
            type: String,
            enum: ["Quote", "Shayari", "Poem", "Blog", "Short Story", "Artical"]
        },
        color:{
            type: String,
            default : '46244c'
        } ,
        like: Boolean,


        user : {type : mongoose.Schema.Types.ObjectId, ref:"user"},
    },
     
    {timestamps:true}
);

module.exports = mongoose.model("motivation", motivationModel)

