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
  setCodeUpdatedDate
} from "../utils/UserSlice.js";
import { setHtml, setCss, setJavascript } from "../utils/CodeSlice.js";

const Home = () => {
  const [isGridLayout, setIsGridLayout] = useState(true);
  const [codeData, setCodeData] = useState([]);
  const userId = useSelector((state) => state.user.userId);
  const userName = useSelector((state) => state.user.username);
  const codeId = useSelector((state) => state.user.codeId);
  const codeTitle = useSelector((state) => state.user.codeTitle);
  const codeCreatedDate = useSelector((state) => state.user.codeCreatedDate);
  const codeUpdatedDate = useSelector((state) => state.user.codeUpdatedDate);

  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const fetchUserCodes = () => {
    axios
      .post(`http://localhost:5000/api/all-codes/${userId}`, {
        username: userName,
        userId: userId
      })
      .then((res) => {
        console.log(res.data.data)
        let responseData = res.data.data;
        for (let item in responseData) {
          setCodeData(responseData[item])
          dispatch(setUsername(res.data?.data?.username));
          dispatch(setCodeTitle(responseData[item]?.code_title));
          dispatch(setCodeId(responseData[item]?.code_id));
          dispatch(setCodeCreatedDate(responseData[item]?.createdAt));
          dispatch(setCodeUpdatedDate(responseData[item]?.updatedAt))
        }
      })
      .catch((error) => {
        console.log("this is error", error);
      });
  }

  const fetchCode = () => {
    axios.post("http://localhost:5000/api/fetch-code", {
      id: codeId
    }).then((res) => {
      console.log("this is res", res.data.data)
      dispatch(setHtml(res.data.data.html_code));
      dispatch(setCss(res.data.data.css_code));
      dispatch(setJavascript(res.data.data.js_code));
      dispatch(setCodeId(res.data.data.code_id));
      navigate(`/editor/${res.data.data.id}`);
    }).catch((error) => {
      console.log("this is error", error);
    });
  }
  
  const handleCreateClick = () => {
    const projectID = "new";
    navigate(`/editor/${projectID}`);
  }

  useEffect(() => {
    Home()
  }, [])
  

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
        <button onClick={handleCreateClick} className="btnBlue rounded-sm ">
          +
        </button>
      </div>
      <div className="cards">
        {isGridLayout ? (
          <div className="grid px-[100px]" onClick={fetchCode}>
            {Object.entries(codeData)
              .filter(([key, value]) => typeof value === "object") // ✅ Ensure only objects are used
              .map(([key, item], index) => (
                <GridCard
                  key={item.code_id} // ✅ Use code_id as a unique key
                  index={index}
                  codeDetails={item} // ✅ Pass the object as a prop
                />
              ))}
          </div>
        ) : (
          <div className="list px-[100px]" onClick={fetchCode}>
            <ListCard />
            <ListCard />
            <ListCard />
            <ListCard />
            <ListCard />
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
