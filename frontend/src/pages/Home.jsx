import { useCallback, useEffect, useRef, useState } from "react";
import ListCard from "../components/ListCard";
import GridCard from "../components/GridCard";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useSelector } from "react-redux";

const Home = () => {
  const debounceTimeout = useRef(null); //  Use useRef for debouncing
  const [isGridLayout, setIsGridLayout] = useState(true);
  const [codeData, setCodeData] = useState([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [pageError, setPageError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const userId = useSelector((state) => state.user.userId);
  const userName = useSelector((state) => state.user.username);

  const navigate = useNavigate();
  const searchBar = useRef(null);

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

  //  Fetch all codes initially
  const fetchUserCodes = useCallback(async () => {
    if (!userId) {
      setCodeData([]);
      setIsLoading(false);
      return;
    }

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/all-codes/${userId}`,
        {},
        { withCredentials: true }
      );

      setCodeData(res.data.data?.codes || []);
      setPageError("");
    } catch (error) {
      console.error("Error fetching codes:", error);
      setPageError("Unable to load your saved projects right now.");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  //  Handle search with debounce using useRef
  const handleSearch = (e) => {
    const titleValue = e.target.value;
    setQuery(titleValue);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current); //  Clear previous debounce
    }

    if (titleValue.trim()) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setResults([]);
      fetchUserCodes(); //  Reset list when clearing, this will show all user codes as nothing is in search box
      return;
    }

    //  Set debounce with useRef
    debounceTimeout.current = setTimeout(() => {
      axios
        .get(
          `${import.meta.env.VITE_BACKEND_URL}/api/search?title=${encodeURIComponent(
            titleValue
          )}`,
          { withCredentials: true }
        )
        .then((res) => setResults(res.data.data || []))
        .catch((err) => {
          if (err.response?.status === 404) {
            setResults([]);
            return;
          }

          console.error("Error in search:", err);
        });
    }, 400);
  };

  //  Handle suggestion click
  const handleSelect = (title) => {
    //  Match the correct key (code_title)
    const selectedCode = results.find((code) => code.code_title === title);

    if (selectedCode) {
      setCodeData([selectedCode]);
      setQuery(title);
      setShowSuggestions(false);
    }
  };

  //  Handle code deletion
  const handleDelete = (codeId) => {
    axios
      .post(
        `${import.meta.env.VITE_BACKEND_URL}/api/delete/${codeId}`,
        {},
        { withCredentials: true }
      )
      .then(() => {
        setCodeData((prevCodes) =>
          prevCodes.filter((code) => code.code_id !== codeId)
        );
      })
      .catch((error) => console.error("Error deleting code:", error));
  };

  //  Create new code button click
  const handleCreateClick = () => {
    navigate(`/editor/new`);
  };

  useEffect(() => {
    fetchUserCodes();
  }, [fetchUserCodes]);

  return (
    <div>

      <div className="flex items-center justify-between px-[100px] my-[40px]">
        <h2 className="text-2xl">Hi, {userName}</h2>

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

            {/*  Suggestions Dropdown */}
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

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsGridLayout((currentValue) => !currentValue)}
            className="rounded-sm border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300/30 hover:text-white"
          >
            {isGridLayout ? "List View" : "Grid View"}
          </button>
          <button onClick={handleCreateClick} className="btnBlue rounded-sm">
            +
          </button>
        </div>
      </div>

      {/*  Cards Section */}
      <div className="cards">
        {pageError && (
          <div className="px-[100px] pb-6 text-sm text-rose-300">{pageError}</div>
        )}

        {isLoading ? (
          <div className="px-[100px] text-slate-300">Loading your projects...</div>
        ) : isGridLayout ? (
          <div className="grid px-[100px]">
            {codeData.length > 0 ? (
              codeData.map((item) => (
                <GridCard
                  key={item.code_id}
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
                <ListCard
                  key={item.code_id}
                  codeDetails={item}
                  handleDelete={() => handleDelete(item.code_id)}
                />
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

