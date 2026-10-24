const bcrypt = require("bcryptjs");
const User = require("../models/User");

const seedAdmin = async () => {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Wedding Admin";
  const forcePasswordReset = process.env.ADMIN_FORCE_PASSWORD_RESET === "true";

  if (!email || !password) {
    console.warn(
      "Admin seed skipped: ADMIN_EMAIL and ADMIN_PASSWORD are not configured."
    );
    return;
  }

  const existingAdmin = await User.findOne({ email }).select("+password");

  if (existingAdmin) {
    let hasChanges = false;

    if (existingAdmin.role !== "admin") {
      existingAdmin.role = "admin";
      hasChanges = true;
    }

    if (forcePasswordReset) {
      const passwordMatches = await bcrypt.compare(
        password,
        existingAdmin.password
      );

      if (!passwordMatches) {
        existingAdmin.password = await bcrypt.hash(password, 12);
        hasChanges = true;
        console.log(`Admin password reset from environment for ${email}`);
      }
    }

    if (hasChanges) {
      await existingAdmin.save();
    }

    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await User.create({
    name,
    email,
    password: hashedPassword,
    role: "admin",
  });

  console.log(`Admin account created for ${email}`);
};

module.exports = seedAdmin;
