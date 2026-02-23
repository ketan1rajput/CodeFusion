import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const PracticeEditor = () => {
  const { id } = useParams();

  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [html, setHtml] = useState("");
  const [css, setCss] = useState("");
  const [js, setJs] = useState("");

  useEffect(() => {
    async function fetchQuestion() {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/frontend-questions/e4f7ef94-fc91-448e-9855-ffa04fe10453`
        );

        setQuestion(res.data.data);
        setHtml(res.data.data.starter_html || "");
        setCss(res.data.data.starter_css || "");
        setJs(res.data.data.starter_js || "");
      } catch (err) {
        console.error("Error fetching question", err);
      } finally {
        setLoading(false);
      }
    }

    fetchQuestion();
  }, [id]);

  if (loading) return <div className="text-white p-10">Loading...</div>;

  if (!question)
    return <div className="text-white p-10">Question not found</div>;

  return (
    <div className="text-white p-10">
      <h1 className="text-2xl font-bold mb-4">{question.title}</h1>
      <p className="text-gray-400">{question.description}</p>

      <div className="mt-8 grid grid-cols-3 gap-6">
  <div>
    <h3 className="mb-2 font-semibold">HTML</h3>
    <textarea
      value={html}
      onChange={(e) => setHtml(e.target.value)}
      className="w-full h-[300px] bg-black p-3 rounded"
    />
  </div>

  <div>
    <h3 className="mb-2 font-semibold">CSS</h3>
    <textarea
      value={css}
      onChange={(e) => setCss(e.target.value)}
      className="w-full h-[300px] bg-black p-3 rounded"
    />
  </div>

  <div>
    <h3 className="mb-2 font-semibold">JS</h3>
    <textarea
      value={js}
      onChange={(e) => setJs(e.target.value)}
      className="w-full h-[300px] bg-black p-3 rounded"
    />
  </div>
</div>
    </div>
    
  );
};

export default PracticeEditor;