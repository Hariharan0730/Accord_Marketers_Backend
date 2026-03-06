const nodemailer = require("nodemailer");
const Settings = require("../models/settings");
const CryptoJS = require("crypto-js");

const sendEmail = async (to, subject, html) => {

    const settings = await Settings.findOne();

    if (!settings || !settings.email) {
        throw new Error("Email settings not configured");
    }

    if (!settings.email.smtpPassword) {
        throw new Error("SMTP password missing");
    }

    const bytes = CryptoJS.AES.decrypt(
        settings.email.smtpPassword,
        process.env.SECRET_KEY
    );

    const smtpPassword = bytes.toString(CryptoJS.enc.Utf8);
    console.log("SMTP EMAIL:", settings.email.smtpEmail);
    console.log("SMTP PASSWORD:", smtpPassword);

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: settings.email.smtpEmail,
            pass: smtpPassword
        }
    });

    await transporter.sendMail({
        from: `"${settings.email.senderName}" <${settings.email.smtpEmail}>`,
        to,
        subject,
        html
    });
    await transporter.verify();
};

module.exports = sendEmail;