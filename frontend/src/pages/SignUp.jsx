import React, { useState } from "react";
import logo from "../images/logo.png";
import image from "../images/authPageSide.png";

const SignUp = () => {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);

  const submitForm =  (e) => {
    e.preventDefault();
  }

  const handleToggle = () => {
    setIsLogin(!isLogin);
  }

  return (
    <>
      <div className="container w-screen min-h-screen flex items-center justify-between pl-[100px]">
        <div className="left w-[35%]">
          <img className="w-[200px]" src={logo} alt="" />
          <form onSubmit={submitForm} className="w-full mt-[60px]" action="">
            <div className="inputBox">
              <input
                required
                type="text"
                placeholder="Username"
                onChange={(e) => {
                  setUsername(e.target.value);
                }}
                value={username}
              />
            </div>
            {!isLogin && (
              <div className="inputBox">
                <input
                  required
                  type="text"
                  placeholder="Name"
                  onChange={(e) => {
                    setName(e.target.value);
                  }}
                  value={name}
                />
              </div>
            )}
            {!isLogin && (
              <div className="inputBox">
                <input
                  required
                  type="email"
                  placeholder="Email"
                  onChange={(e) => {
                    setEmail(e.target.value);
                  }}
                  value={email}
                />
              </div>
            )}
            <div className="inputBox">
              <input
                required
                type="password"
                placeholder="Password"
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
                value={password}
              />
            </div>
          </form>
          <p className="text-[grey]">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={handleToggle}>
              {isLogin ? (
                <div className="text-[#00AEEF]">Sign Up</div>
              ) : (
                <div className="text-[#00AEEF]">Login</div>
              )}
            </button>

            {isLogin ? (
              <button className="btnBlue w-full mt-[20px]">Login</button>
            ) : (
              <button className="btnBlue w-full mt-[20px]">Sign Up</button>
            )}
          </p>
        </div>
        <div className="right w-[55%]">
          <img className="h-[100vh] w-[100%] object-cover" src={image} alt="" />
        </div>
      </div>
    </>
  );
};

export default SignUp;