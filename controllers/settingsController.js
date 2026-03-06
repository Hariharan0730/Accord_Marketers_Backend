const Settings = require("../models/settings");
const CryptoJS = require("crypto-js");


const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const unzipper = require("unzipper");

const Blog = require("../models/blog");
const Activity = require("../models/activity");
const Admin = require("../models/admin");




exports.getSettings = async (req, res) => {
  try {

    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({});
    }

    res.json({
      website: settings.website,
      email: {
        smtpEmail: settings.email.smtpEmail,
        senderName: settings.email.senderName
      }
    });

  } catch (error) {
    console.error("GET SETTINGS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};


exports.updateWebsiteSettings = async (req, res) => {
  try {

    const settings = await Settings.findOneAndUpdate(
      {}, 
      {
        $set: {
          website: req.body
        }
      },
      {
        new: true,
        upsert: true
      }
    );

    res.json(settings.website);

  } catch (error) {
    console.error("UPDATE WEBSITE SETTINGS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};



exports.updateEmailSettings = async (req, res) => {
  try {

    let encryptedPassword;

    if (req.body.smtpPassword) {
      encryptedPassword = CryptoJS.AES.encrypt(
        req.body.smtpPassword,
        process.env.SECRET_KEY
      ).toString();
    }

    const updateData = {
      "email.smtpEmail": req.body.smtpEmail,
      "email.senderName": req.body.senderName
    };

    if (encryptedPassword) {
      updateData["email.smtpPassword"] = encryptedPassword;
    }

    await Settings.findOneAndUpdate(
      {},
      { $set: updateData },
      { new: true, upsert: true }
    );

    res.json({
      smtpEmail: req.body.smtpEmail,
      senderName: req.body.senderName
    });

  } catch (error) {
    console.error("UPDATE EMAIL SETTINGS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};



exports.clearActivityLogs = async (req, res) => {
  try {

    await Activity.deleteMany();

    res.json({ message: "Activity logs cleared" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

