const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
{
 website:{
   siteTitle:{
     type:String,
     default:"Accord Marketers"
   },
   contactEmail:String,
   phone:String,
   address:String
 },

 email:{
   smtpEmail:String,
   smtpPassword:String,
   senderName:String
 },

 media:{
   maxUploadSize:{
     type:Number,
     default:5
   },
   allowedFormats:{
     type:[String],
     default:["jpg","png","webp"]
   }
 },

 system:{
   maintenanceMode:{
     type:Boolean,
     default:false
   }
 }

},
{timestamps:true}
);

module.exports = mongoose.model("Settings",settingsSchema);