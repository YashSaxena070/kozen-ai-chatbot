const mongoose=require("mongoose");

//Schema
const userSchema = new mongoose.Schema({
    username: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,    // Always String (hashed password stored here)
      required: true
    }
  });
const User = mongoose.model('user', userSchema);
module.exports=User; 