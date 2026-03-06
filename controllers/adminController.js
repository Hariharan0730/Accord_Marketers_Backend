const Admin = require("../models/admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
exports.registerAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password required" });
        }

        const existing = await Admin.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: "Admin already exists" });
        }

        const admin = new Admin({ email, password });
        await admin.save(); 

        res.status(201).json({ message: "Admin created successfully" });

    }
    catch (error) {
        console.error("REGISTER ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.loginAdmin = async (req, res) => {
    const { email, password } = req.body;

    try {
        const admin = await Admin.findOne({ email });

        if (!admin)
            return res.status(400).json({ message: "Invalid credentials" });


        const isMatch = await bcrypt.compare(password, admin.password);


        if (!isMatch)
            return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign(
            { id: admin._id },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "All fields required" });
        }

        const admin = await Admin.findById(req.admin.id);

        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }


        const isMatch = await bcrypt.compare(currentPassword, admin.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Current password incorrect" });
        }
        if (currentPassword === newPassword) {
            return res.status(400).json({ message: "New password must be different" });
        }


        admin.password = newPassword;
        await admin.save(); 

        res.json({ message: "Password updated successfully" });

    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.json({ message: "If account exists, reset link sent" });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");

        const hashedToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        admin.resetPasswordToken = hashedToken;
        admin.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
        await admin.save();

        const resetLink = `http://localhost:5173/admin/reset-password/${resetToken}`;


        await sendEmail(
            admin.email,
            "Password Reset - Accord Marketers",
            `
                <h3>Password Reset Request</h3>
                <p>You requested a password reset.</p>
                <p>Click below to reset your password:</p>
                <a href="${resetLink}">${resetLink}</a>
                <p>This link will expire in 15 minutes.</p>
            `
        );


        res.json({ message: "If account exists, reset link sent" });

    } catch (error) {
        console.error("FORGOT PASSWORD ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
};
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const admin = await Admin.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() }
        });
        if (!admin) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        admin.password = newPassword;
        admin.resetPasswordToken = undefined;
        admin.resetPasswordExpire = undefined;

        await admin.save();

        res.json({ message: "Password reset successful" });

    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
exports.getProfile = async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin.id).select("-password");
        res.json(admin);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
exports.updateProfile = async (req, res) => {

    try {

        const { name, email } = req.body;

        const admin = await Admin.findById(req.admin.id);

        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }


        admin.name = name || admin.name;
        admin.email = email || admin.email;


        if (req.file) {
            admin.profileImage = req.file.path;
        }

        await admin.save();

        res.json({
            message: "Profile updated",
            admin
        });

    } catch (error) {

        console.error("UPDATE PROFILE ERROR:", error);

        res.status(500).json({
            message: "Server error"
        });

    }

};