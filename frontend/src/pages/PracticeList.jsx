import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const difficultyClasses = {
  easy: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  medium: "border-amber-400/30 bg-amber-400/10 text-amber-100",
  hard: "border-rose-400/30 bg-rose-400/10 text-rose-100",
};

const PracticeList = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/frontend-questions`,
          { withCredentials: true }
        );

        setQuestions(response.data.data || []);
      } catch {
        setError("Unable to load practice questions right now.");
      } finally {
        setLoading(false);
      }
    }

    fetchQuestions();
  }, []);

  return (
    <div className="min-h-screen bg-[#081120] px-6 py-10 text-white md:px-12 xl:px-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-3 text-sm uppercase tracking-[0.35em] text-cyan-200/70">
              Frontend Interview Practice
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-slate-50">
              Pick a challenge and solve it in the live CodeFusion workspace.
            </h1>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-slate-300">
            {questions.length} question{questions.length === 1 ? "" : "s"} available
          </div>
        </div>

        {loading && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-slate-300">
            Loading frontend interview questions...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-3xl border border-rose-400/20 bg-rose-400/10 p-10 text-rose-100">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
            {questions.map((question) => (
              <article
                key={question.id}
                className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.95),rgba(8,17,32,0.92))] p-6 shadow-[0_24px_80px_rgba(2,6,23,0.35)] transition duration-200 hover:-translate-y-1 hover:border-cyan-300/30"
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <h2 className="text-xl font-semibold leading-snug text-slate-50">
                    {question.title}
                  </h2>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                      difficultyClasses[question.difficulty] || difficultyClasses.easy
                    }`}
                  >
                    {question.difficulty}
                  </span>
                </div>

                <div className="mb-6 flex flex-wrap gap-2">
                  {(question.tags || []).map((tag) => (
                    <span
                      key={`${question.id}-${tag}`}
                      className="rounded-full border border-cyan-200/15 bg-cyan-200/10 px-3 py-1 text-xs text-cyan-50"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mb-6 grid grid-cols-2 gap-3 text-sm text-slate-300">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
                      Time Limit
                    </div>
                    <div className="mt-2 text-lg font-semibold text-white">
                      {question.timeLimitMinutes} min
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
                      Focus
                    </div>
                    <div className="mt-2 text-lg font-semibold text-white">
                      {(question.tags || [])[0] || "Frontend"}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/practice/${question.id}`)}
                  className="w-full rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
                >
                  Solve
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PracticeList;
