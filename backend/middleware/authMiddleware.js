const jwt = require("jsonwebtoken");
const Invitation = require("../models/Invitation");

const protect = (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const token = authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token.",
    });
  }
};

const requireInvitationUnlock = async (req, res, next) => {
  try {
    const invitation = await Invitation.findOne({ _id: req.params.id, createdBy: req.user.id }).select("+lockPasswordHash");
    if (!invitation) {
      return res.status(404).json({ success: false, message: "Invitation not found." });
    }
    // Backward compatibility: invitations created before password locking remain manageable.
    if (!invitation.lockPasswordHash) return next();

    const token = req.headers["x-invitation-unlock"];
    if (!token) {
      return res.status(423).json({ success: false, message: "Unlock this invitation with its password first." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== "invitation_unlock" || decoded.invitationId !== req.params.id || decoded.id !== req.user.id) {
      return res.status(423).json({ success: false, message: "Invitation is locked. Enter its password to continue." });
    }
    next();
  } catch (error) {
    return res.status(423).json({ success: false, message: "Invitation is locked or the unlock session has expired." });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required.",
    });
  }

  next();
};

module.exports = { protect, requireAdmin, requireInvitationUnlock };
