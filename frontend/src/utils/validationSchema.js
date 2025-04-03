import * as Yup from "yup";

const validationSchema = Yup.object({
  email: Yup.string()
    .email("Invalid email format")
    .matches(/@gmail\.com$/, "Only Gmail addresses allowed")
    .required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters long")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .required("Password is required"),
  username: Yup.string().required("Username is required"),
  name: Yup.string().required("name is required"),
});

export default validationSchema;
