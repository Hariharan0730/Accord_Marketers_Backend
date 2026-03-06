const Contact = require("../models/contact");
const Settings = require("../models/settings");
const nodemailer = require("nodemailer");
const CryptoJS = require("crypto-js");


 ================================
   CREATE CONTACT (PUBLIC)
================================ */

exports.createContact = async (req, res) => {

    try {

        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({
                message: "All fields required"
            });
        }

        

        const contact = await Contact.create({
            name,
            email,
            message,
            status: "new",
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"]
        });


        

        const settings = await Settings.findOne();

        if (!settings?.email?.smtpEmail || !settings?.email?.smtpPassword) {
            return res.status(500).json({
                message: "SMTP settings not configured"
            });
        }


        

        const bytes = CryptoJS.AES.decrypt(
            settings.email.smtpPassword,
            process.env.SECRET_KEY
        );

        const smtpPassword = bytes.toString(CryptoJS.enc.Utf8);


        

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: settings.email.smtpEmail,
                pass: smtpPassword
            }
        });


        

        try {

            await transporter.sendMail({
                from: settings.email.smtpEmail,
                to: settings.email.smtpEmail,
                subject: `New Contact Lead - ${name}`,
                html: `
          <h3>New Website Lead</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong> ${message}</p>
        `
            });

        } catch (mailError) {

            console.log("Email failed:", mailError.message);

        }

        res.status(201).json({
            success: true,
            message: "Message sent successfully"
        });

    }

    catch (error) {

        console.error("CONTACT ERROR:", error);

        res.status(500).json({
            message: error.message
        });

    }

};



 ================================
   GET ALL CONTACTS (ADMIN)
================================ */

exports.getContacts = async (req, res) => {

    try {

        const page = parseInt(req.query.page) || 1;
        const limit = 10;

        const skip = (page - 1) * limit;

        const contacts = await Contact.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Contact.countDocuments();

        res.json({
            contacts,
            totalPages: Math.ceil(total / limit)
        });

    } catch (error) {

        console.error("GET CONTACTS ERROR:", error);

        res.status(500).json({
            message: "Server error"
        });

    }

};



 ================================
   UPDATE CONTACT STATUS
================================ */

exports.updateContactStatus = async (req, res) => {

    try {

        const { status } = req.body;

        if (!["new", "contacted", "closed"].includes(status)) {
            return res.status(400).json({
                message: "Invalid status"
            });
        }

        const contact = await Contact.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!contact) {
            return res.status(404).json({
                message: "Contact not found"
            });
        }

        res.json({
            message: "Status updated",
            contact
        });

    } catch (error) {

        console.error("UPDATE CONTACT ERROR:", error);

        res.status(500).json({
            message: "Server error"
        });

    }

};



 ================================
   DELETE CONTACT
================================ */

exports.deleteContact = async (req, res) => {

    try {

        const contact = await Contact.findByIdAndDelete(req.params.id);

        if (!contact) {
            return res.status(404).json({
                message: "Contact not found"
            });
        }

        res.json({
            message: "Contact deleted"
        });

    } catch (error) {

        console.error("DELETE CONTACT ERROR:", error);

        res.status(500).json({
            message: "Server error"
        });

    }

};