import { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import ListCard from "../components/ListCard";
import GridCard from "../components/GridCard";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { setSelectedCode } from "../utils/CodeSlice.js";

const Home = () => {
  const debounceTimeout = useRef(null); // ✅ Use useRef for debouncing
  const [isGridLayout, setIsGridLayout] = useState(true);
  const [codeData, setCodeData] = useState([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const userId = useSelector((state) => state.user.userId);
  const userName = useSelector((state) => state.user.username);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const searchBar = useRef(null); // Use useRef here for direct reference

  // Function to trigger search bar with CTRL+K
  const triggerSearchBar = (event) => {
    if (event.ctrlKey && event.key === "k") {
      event.preventDefault();
      // Focus the search input
      if (searchBar.current) {
        searchBar.current.focus();
      }
    }
  };

  // Event listener setup in useEffect
  useEffect(() => {
    const handleKeyDown = (event) => {
      triggerSearchBar(event); // Check for Ctrl + K
    };

    window.addEventListener("keydown", handleKeyDown);

    // Cleanup the event listener on unmount
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // ✅ Fetch all codes initially
  const fetchUserCodes = () => {
    axios
      .post(
        `${import.meta.env.VITE_BACKEND_URL}/api/all-codes/${userId}`,
        { username: userName, userId: userId },
        { withCredentials: true }
      )
      .then((res) => {
        const responseData = res.data.data;
        const codeArray = Object.values(responseData).filter(
          (item) => typeof item === "object"
        );
        setCodeData(codeArray);
      })
      .catch((error) => console.log("Error fetching codes:", error));
  };

  // ✅ Handle search with debounce using useRef
  const handleSearch = (e) => {
    const titleValue = e.target.value;
    setQuery(titleValue);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current); // ✅ Clear previous debounce
    }

    if (titleValue.trim()) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setResults([]);
      fetchUserCodes(); // ✅ Reset list when clearing, this will show all user codes as nothing is in search box
      return;
    }

    // ✅ Set debounce with useRef
    debounceTimeout.current = setTimeout(() => {
      axios
        .get(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/search?title=${titleValue}&username=${userName}`
        )
        .then((res) => setResults(res.data))
        .catch((err) => console.error("Error in search:", err));
    }, 400); // 400ms delay
  };

  // ✅ Handle suggestion click
  const handleSelect = (title) => {
    console.log("Selected title:", title);

    // ✅ Match the correct key (code_title)
    const selectedCode = results.find((code) => code.code_title === title);

    if (selectedCode) {
      dispatch(
        setSelectedCode({
          html: selectedCode.html,
          css: selectedCode.css,
          javascript: selectedCode.javascript,
          code_id: selectedCode.code_id,
        })
      );

      // Display only the selected code
      setCodeData([selectedCode]);

      setQuery(title);
      setShowSuggestions(false);
    } else {
      console.log("Code not found in results");
    }
  };

  // ✅ Handle code deletion
  const handleDelete = (codeId) => {
    axios
      .post(`${import.meta.env.VITE_BACKEND_URL}/api/delete/${codeId}`)
      .then(() => {
        setCodeData((prevCodes) =>
          prevCodes.filter((code) => code.code_id !== codeId)
        );
      })
      .catch((error) => console.error("Error deleting code:", error));
  };

  // ✅ Create new code button click
  const handleCreateClick = () => {
    navigate(`/editor/new`);
  };

  useEffect(() => {
    fetchUserCodes();
  }, []);

  return (
    <div>
      <Navbar isGridLayout={isGridLayout} setIsGridLayout={setIsGridLayout} />

      <div className="flex items-center justify-between px-[100px] my-[40px]">
        <h2 className="text-2xl">Hi, {userName}👋</h2>

        <div className="flex items-center gap-1 relative">
          <div className="inputBox !w-[400px]">
            <input
              ref={searchBar} // Set the ref to the search bar
              id="Search_Box"
              type="text"
              placeholder="Search Here or press CTRL + k"
              value={query}
              onChange={handleSearch}
            />

            {/* ✅ Suggestions Dropdown */}
            {showSuggestions && results.length > 0 && (
              <div className="absolute top-full left-0 w-full bg-white border rounded-md shadow-md z-10">
                {results.map((item) => (
                  <div
                    key={item.code_id}
                    onClick={() => handleSelect(item.code_title)}
                    className="p-2 cursor-pointer hover:bg-gray-800 bg-black text-white"
                  >
                    {item.code_title}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button onClick={handleCreateClick} className="btnBlue rounded-sm">
          +
        </button>
      </div>

      {/* ✅ Cards Section */}
      <div className="cards">
        {isGridLayout ? (
          <div className="grid px-[100px]">
            {codeData.length > 0 ? (
              codeData.map((item, index) => (
                <GridCard
                  key={item.code_id}
                  index={index}
                  codeDetails={item}
                  handleDelete={() => handleDelete(item.code_id)}
                />
              ))
            ) : (
              <p>No code found</p>
            )}
          </div>
        ) : (
          <div className="list px-[100px]">
            {codeData.length > 0 ? (
              codeData.map((item) => (
                <ListCard key={item.code_id} codeDetails={item} />
              ))
            ) : (
              <p>No code found</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
