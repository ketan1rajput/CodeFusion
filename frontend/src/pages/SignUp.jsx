import { useState } from "react";
import logo from "../images/logo.png";
import image from "../images/authPageSide.png";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  setUsername as setReduxUsername,
  setUserId,
} from "../utils/UserSlice.js";
import PopupModal from "../components/PopupModal.jsx";
import validationSchema from "../utils/validationSchema.js"; // ✅ Import Yup schema

const SignUp = () => {
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const usernamefromredux = useSelector((state) => state.user.username);
  const [isLogin, setIsLogin] = useState(true);

  // ✅ Modal states
  const [isOpen, setIsOpen] = useState(false);
  const [modalType, setModalType] = useState("success");
  const [message, setMessage] = useState("");

  // ✅ Toggle between login and signup
  const handleToggle = () => setIsLogin(!isLogin);

  // ✅ Handle Input Change with Yup Validation
  const handleChange = async (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    try {
      await validationSchema.validateAt(name, { [name]: value });
      setErrors((prev) => ({ ...prev, [name]: "" })); // Clear error if valid
    } catch (err) {
      setErrors((prev) => ({ ...prev, [name]: err.message })); // Set error if invalid
    }
  };

  // ✅ Handle Login
  const handleLogin = async () => {
    try {
      await validationSchema.validate(formData, { abortEarly: false });
    } catch (validationError) {
      const newErrors = {};
      validationError.inner.forEach((err) => {
        newErrors[err.path] = err.message;
      });
      setErrors(newErrors);
      return;
    }

    axios
      .post(
        `${import.meta.env.VITE_BACKEND_URL}/api/login`,
        {
          username: formData.username,
          password: formData.password,
        },
        { withCredentials: true }
      )
      .then((res) => {
        dispatch(setReduxUsername(res.data.user.username));
        dispatch(setUserId(res.data.user.id));

        setMessage("Login successful!");
        setModalType("success");
        setIsOpen(true);
        navigate(`/home`);
      })
      .catch((err) => {
        setMessage("Invalid username or password!");
        setModalType("error");
        setIsOpen(true);
      });
  };

  // ✅ Handle Signup
  const handleSignUp = async () => {
    try {
      await validationSchema.validate(formData, { abortEarly: false });
    } catch (validationError) {
      const newErrors = {};
      validationError.inner.forEach((err) => {
        newErrors[err.path] = err.message;
      });
      setErrors(newErrors);
      return;
    }

    axios
      .post(`${import.meta.env.VITE_BACKEND_URL}/api/sign-up`, formData)
      .then((res) => {
        dispatch(setReduxUsername(formData.username));
        setMessage("Account created successfully! Click login to continue.");
        setModalType("success");
        setIsOpen(true);
        navigate("/");
      })
      .catch((error) => {
        if (error.response?.status === 409) {
          setMessage("Username already exists!");
          setModalType("error");
          setIsOpen(true);
        } else {
          setMessage("Signup failed. Try again!");
          setModalType("error");
          setIsOpen(true);
        }
      });
  };

  return (
    <div className="container w-screen min-h-screen flex items-center justify-between pl-[100px]">
      <div className="left w-[35%]">
        <img className="w-[200px]" src={logo} alt="Logo" />
        <form className="w-full mt-[60px]" onSubmit={(e) => e.preventDefault()}>
          <div className="inputBox">
            <input
              required
              type="text"
              name="username"
              placeholder="Username"
              onChange={handleChange}
              value={formData.username}
            />
            {errors.username && (
              <p className="text-red-500">{errors.username}</p>
            )}
          </div>

          {!isLogin && (
            <>
              <div className="inputBox">
                <input
                  required
                  type="text"
                  name="name"
                  placeholder="Name"
                  onChange={handleChange}
                  value={formData.name}
                />
                {errors.name && <p className="text-red-500">{errors.name}</p>}
              </div>

              <div className="inputBox">
                <input
                  required
                  type="email"
                  name="email"
                  placeholder="Email"
                  onChange={handleChange}
                  value={formData.email}
                />
                {errors.email && <p className="text-red-500">{errors.email}</p>}
              </div>
            </>
          )}

          <div className="inputBox">
            <input
              required
              type="password"
              name="password"
              placeholder="Password"
              onChange={handleChange}
              value={formData.password}
            />
            {errors.password && (
              <p className="text-red-500">{errors.password}</p>
            )}
          </div>
        </form>

        <p className="text-[grey]">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={handleToggle} className="text-[#00AEEF]">
            {isLogin ? "Sign Up" : "Login"}
          </button>
        </p>

        {isLogin ? (
          <button className="btnBlue w-full mt-[20px]" onClick={handleLogin}>
            Login
          </button>
        ) : (
          <button className="btnBlue w-full mt-[20px]" onClick={handleSignUp}>
            Sign Up
          </button>
        )}
      </div>

      <div className="right w-[55%]">
        <img
          className="h-[100vh] w-[100%] object-cover"
          src={image}
          alt="Auth"
        />
      </div>

      <PopupModal
        message={message}
        type={modalType}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
};

export default SignUp;
