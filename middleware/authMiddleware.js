const jwt = require("jsonwebtoken");
const Admin = require("../models/admin");

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token, access denied" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);


    const admin = await Admin.findById(verified.id).select("-password");

    if (!admin) {
      return res.status(401).json({ message: "Admin not found" });
    }

    req.admin = admin; 

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};