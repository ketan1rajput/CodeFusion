const { where } = require("sequelize");
const User = require("../../models/User");

async function signUp(credentials) {
  const { username, name, email, password } = credentials;

  // Check if username already exists
  const existingUser = await Login.findOne({ where: { username } });
  if (existingUser) {
    throw new Error("Username already exists");
  }

  await User.create({
    username,
    name,
    email,
    password,
  });
  return { success: true, user: newUser };
}

module.exports = { signUp };
