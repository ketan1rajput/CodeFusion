const { Op } = require("sequelize");
const User = require("../../models/User");
const bcrypt = require("bcrypt");
const { serializeUser } = require("../utils/auth");

const signUp = async (credentials, res) => {
  const { username, name, email, password } = credentials;

  try {
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }],
      },
    });

    if (existingUser) {
      const duplicateField =
        existingUser.username === username ? "Username" : "Email";

      return res.status(409).json({
        message: `${duplicateField} already exists`,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "User created successfully",
      user: serializeUser(newUser),
    });
  } catch (error) {
    console.error("Sign-up Error:", error);

    if (error.name === "SequelizeDatabaseError") {
      res.status(500).json({ message: "Database error" });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

module.exports = { signUp };
