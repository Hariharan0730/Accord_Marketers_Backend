const express = require("express");
const router = express.Router();

const {
  createContact,
  getContacts,
  updateContactStatus,
  deleteContact
} = require("../controllers/contactController");

const authMiddleware = require("../middleware/authMiddleware");

router.post("/", createContact);
router.get("/admin", authMiddleware, getContacts);

router.put("/admin/:id", authMiddleware, updateContactStatus);

router.delete("/admin/:id", authMiddleware, deleteContact);


module.exports = router;