const Joi = require("joi");

const signUpSchema = Joi.object({
  username: Joi.string().min(3).required().messages({
    "string.empty": "Username is required",
    "string.min": "Username must be at least 3 characters",
  }),
  name: Joi.string().required().messages({
    "string.empty": "Name is required",
  }),
  email: Joi.string().email().required().messages({
    "string.empty": "Email is required",
    "string.email": "Invalid email address",
  }),
  password: Joi.string().min(6).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 6 characters",
  }),
});

const loginSchema = Joi.object({
  username: Joi.string().min(3).required().messages({
    "string.empty": "Username is required",
    "string.min": "Username must be at least 3 characters",
  }),
  password: Joi.string().min(5).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password must be atleast 5 characters",
  }),
});

const detailsSchema = Joi.object({
  username: Joi.string().required().messages({
    "string.empty": "Username is required",
  }),
  userId: Joi.number().required().messages({
    "string.empty": "User Id is required",
  }),
});

const codeSaveSchema = Joi.object({
  cssCode: Joi.string().allow("").required(),
  htmlCode: Joi.string().allow("").required(),
  javaScriptCode: Joi.string().allow("").required(),
  title: Joi.string().trim().required().messages({
    "string.empty": "title is required",
  }),
});

module.exports = {
  signUpSchema,
  loginSchema,
  detailsSchema,
  codeSaveSchema,
};
