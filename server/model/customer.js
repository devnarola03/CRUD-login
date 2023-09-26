const { default: mongoose } = require("mongoose");

const Schema = mongoose.Schema;

const BlogPost = new Schema(
  {
    firstname: String,
    lastname: String,
    email: String,
    phoneno:Number,
    role: String,
    status: String,
    password: String,
    confirmpassword: String,
    token:String
  },
  { timestamps: true }
);

const customer = mongoose.model("customer", BlogPost);

module.exports = customer;
