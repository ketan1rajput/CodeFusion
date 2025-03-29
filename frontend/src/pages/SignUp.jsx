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

const SignUp = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const usernamefromredux = useSelector((state) => state.user.username);

  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);

  // ✅ Modal states
  const [isOpen, setIsOpen] = useState(false);
  const [modalType, setModalType] = useState("success");
  const [message, setMessage] = useState("");

  // ✅ Toggle between login and signup
  const handleToggle = () => {
    setIsLogin(!isLogin);
  };

  // ✅ Handle Login
  const handleLogin = () => {
    axios
      .post(
        `${import.meta.env.VITE_BACKEND_URL}/api/login`,
        {
          username: username,
          password: password,
        },
        { withCredentials: true }
      )
      .then((res) => {
        dispatch(setReduxUsername(res.data.user.username));
        dispatch(setUserId(res.data.user.id));

        // ✅ Trigger success modal
        setMessage("Login successful!");
        setModalType("success");
        setIsOpen(true);

        navigate(`/home`);
        console.log(res.data);
      })
      .catch((err) => {
        if (err.response) {
          console.log("Error response", err.response.data);

          // ✅ Trigger error modal
          setMessage("Invalid username or password!");
          setModalType("error");
          setIsOpen(true);
        } else {
          console.error("Login error", err);

          // ✅ Trigger generic error modal
          setMessage("An error occurred while logging in");
          setModalType("error");
          setIsOpen(true);
        }
      });
  };

  // ✅ Handle Signup
  const handleSignUp = () => {
    axios
      .post(`${import.meta.env.VITE_BACKEND_URL}/api/sign-up`, {
        name: name,
        username: username,
        email: email,
        password: password,
      })
      .then((res) => {
        dispatch(setReduxUsername(username));

        // ✅ Trigger success modal
        setMessage(
          "Account created successfully! Click on login button to continue"
        );
        setModalType("success");
        setIsOpen(true);

        navigate("/");
      })
      .catch((error) => {
        if (error.response.status == 409) {
          setMessage("Username already exists!");
          setModalType("error");
          setIsOpen(true);
        } else {
          // ✅ Trigger error modal
          setMessage("Signup failed. Try again!");
          setModalType("error");
          setIsOpen(true);
        }
      });
  };

  return (
    <>
      <div className="container w-screen min-h-screen flex items-center justify-between pl-[100px]">
        <div className="left w-[35%]">
          <img className="w-[200px]" src={logo} alt="Logo" />
          <form
            className="w-full mt-[60px]"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="inputBox">
              <input
                required
                type="text"
                placeholder="Username"
                onChange={(e) => setUsername(e.target.value)}
                value={username}
              />
            </div>

            {!isLogin && (
              <>
                <div className="inputBox">
                  <input
                    required
                    type="text"
                    placeholder="Name"
                    onChange={(e) => setName(e.target.value)}
                    value={name}
                  />
                </div>

                <div className="inputBox">
                  <input
                    required
                    type="email"
                    placeholder="Email"
                    onChange={(e) => setEmail(e.target.value)}
                    value={email}
                  />
                </div>
              </>
            )}

            <div className="inputBox">
              <input
                required
                type="password"
                placeholder="Password"
                onChange={(e) => setPassword(e.target.value)}
                value={password}
              />
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
    </>
  );
};

export default SignUp;
