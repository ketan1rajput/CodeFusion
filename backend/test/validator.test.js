const test = require("node:test");
const assert = require("node:assert/strict");

const {
  codeSaveSchema,
  loginSchema,
  signUpSchema,
} = require("../src/validators/validator");

test("signUpSchema accepts valid registration data", () => {
  const { error } = signUpSchema.validate({
    username: "ketanrajput",
    name: "Ketan Rajput",
    email: "ketan@example.com",
    password: "secret123",
  });

  assert.equal(error, undefined);
});

test("loginSchema rejects a short password", () => {
  const { error } = loginSchema.validate({
    username: "ketanrajput",
    password: "123",
  });

  assert.ok(error);
  assert.match(error.details[0].message, /atleast 5 characters/i);
});

test("codeSaveSchema allows empty code panes when title is present", () => {
  const { error, value } = codeSaveSchema.validate({
    title: "Landing Page",
    htmlCode: "",
    cssCode: "",
    javaScriptCode: "",
  });

  assert.equal(error, undefined);
  assert.equal(value.title, "Landing Page");
});
