const jwt = require("jsonwebtoken");

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

const requireInvitationUnlock = (req, res, next) => {
  try {
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
