const bcrypt = require("bcryptjs");
const User = require("../models/User");

const seedAdmin = async () => {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Wedding Admin";

  if (!email || !password) {
    console.warn(
      "Admin seed skipped: ADMIN_EMAIL and ADMIN_PASSWORD are not configured."
    );
    return;
  }

  const existingAdmin = await User.findOne({ email });

  if (existingAdmin) {
    if (existingAdmin.role !== "admin") {
      existingAdmin.role = "admin";
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
