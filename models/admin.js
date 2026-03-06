const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },


    resetPasswordToken: {
        type: String
    },
    resetPasswordExpire: {
        type: Date
    },
    name: {
        type: String,
        default: "Admin"
    },

    profileImage: {
        type: String
    }
});
adminSchema.pre("save", async function () {
    if (!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password, 10);
});
module.exports = mongoose.model("Admin", adminSchema);