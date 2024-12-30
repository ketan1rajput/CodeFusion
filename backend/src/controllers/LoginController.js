const { where } = require("sequelize");
const User = require("../../models/User");

async function login(credentials) {
  try {
    const { password, username } = credentials;
    const existingUser = await User.findOne({ where: { username, password } });
    if (existingUser) {
      await User.update(
        { isLoggedIn: true },
        { where: { username, password } }
      );
    } else {
      return "No user found !";
    }
  } catch (error) {
    console.error("Error creating user:", error.message);
    return { success: false, error: error.message };
  }
}

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

module.exports = { login, signUp };
