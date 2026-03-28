import { useNavigate } from "react-router-dom";

const BackButton = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className="px-2 py-1 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition"
    >
       Back
    </button>
  );
};

export default BackButton;

