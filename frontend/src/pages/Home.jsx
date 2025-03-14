import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import ListCard from "../components/ListCard";
import GridCard from "../components/GridCard";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import {
  setUsername,
  setCodeTitle,
  setCodeId,
  setCodeCreatedDate,
  setCodeUpdatedDate,
} from "../utils/UserSlice.js";
import { setHtml, setCss, setJavascript } from "../utils/CodeSlice.js";

const Home = () => {
  const [isGridLayout, setIsGridLayout] = useState(true);
  const [codeData, setCodeData] = useState([]); // ✅ Fix: Ensure it's an array

  const userId = useSelector((state) => state.user.userId);
  const userName = useSelector((state) => state.user.username);
  const codeId = useSelector((state) => state.user.codeId);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const fetchUserCodes = () => {
    axios
      .post(
        `http://localhost:5000/api/all-codes/${userId}`,
        {
          username: userName,
          userId: userId,
        },
        { withCredentials: true } // ✅ Ensures cookies are sent with the request
      )
      .then((res) => {
        console.log(res.data.data);

        const responseData = res.data.data;

        // Extracting values from the response object (excluding the "username" key)
        const codeArray = Object.values(responseData).filter(
          (item) => typeof item === "object"
        );

        setCodeData(codeArray);

        // Dispatching user-related info separately
        dispatch(setUsername(responseData?.username));

        // Iterating over code data to update state
        codeArray.forEach((item) => {
          dispatch(setCodeTitle(item?.code_title));
          dispatch(setCodeId(item?.code_id));
          dispatch(setCodeCreatedDate(item?.createdAt));
          dispatch(setCodeUpdatedDate(item?.updatedAt));
        });
      })
      .catch((error) => {
        console.log("this is error", error);
      });
  };

  const fetchCode = (codeId) => {
    navigate(`/editor/${codeId}`);
  };

  const handleCreateClick = () => {
    navigate(`/editor/new`);
  };

  useEffect(() => {
    fetchUserCodes(); // ✅ Fix: Call the actual function
  }, []);

  return (
    <div>
      <Navbar />
      <div className="flex items-center justify-between px-[100px] my-[40px]">
        <h2 className="text-2xl">Hi, {userName}👋</h2>
        <div className="flex items-center gap-1">
          <div className="inputBox !w-[400px]">
            <input type="text" placeholder="Search Here... !" />
          </div>
        </div>
        <button onClick={handleCreateClick} className="btnBlue rounded-sm">
          +
        </button>
      </div>
      <div className="cards">
        {isGridLayout ? (
          <div className="grid px-[100px]">
            {codeData.map((item, index) => (
              <GridCard
                key={item.code_id} // ✅ Use a unique key
                index={index}
                codeDetails={item} // ✅ Pass correct prop
                onClick={() => fetchCode(item.code_id)} // ✅ Fix: Pass code ID
              />
            ))}
          </div>
        ) : (
          <div className="list px-[100px]">
            {codeData.map((item, index) => (
              <ListCard key={item.code_id} codeDetails={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
