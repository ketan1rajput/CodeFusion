import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const difficultyClasses = {
  easy: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  medium: "border-amber-400/30 bg-amber-400/10 text-amber-100",
  hard: "border-rose-400/30 bg-rose-400/10 text-rose-100",
};

const FilterDropdown = ({ label, value, onChange, options }) => (
  <div className="relative">
    <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-400">
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 pr-10 text-sm text-white transition hover:border-cyan-300/30 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value} className="bg-[#141414]">
          {option.label}
        </option>
      ))}
    </select>
    <div className="pointer-events-none absolute right-3 top-[calc(50%+0.5rem)] -translate-y-1 flex h-2 w-2 items-center justify-center">
      <div className="h-0 w-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-400" />
    </div>
  </div>
);

const PracticeList = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

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

  const allTags = useMemo(() => {
    const tags = new Set();
    questions.forEach((q) => (q.tags || []).forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    let result = [...questions];
    
    if (difficultyFilter !== "all") {
      result = result.filter((q) => q.difficulty === difficultyFilter);
    }
    
    if (tagFilter !== "all") {
      result = result.filter((q) => (q.tags || []).includes(tagFilter));
    }
    
    switch (sortBy) {
      case "oldest":
        result.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
        break;
      case "az":
        result.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
        break;
      case "za":
        result.sort((a, b) => (b.title || "").localeCompare(a.title || ""));
        break;
      case "newest":
      default:
        result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
    
    return result;
  }, [questions, difficultyFilter, tagFilter, sortBy]);

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
            {filteredQuestions.length} question{filteredQuestions.length === 1 ? "" : "s"} available
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="min-w-[140px] flex-1 max-w-[200px]">
            <FilterDropdown
              label="Difficulty"
              value={difficultyFilter}
              onChange={setDifficultyFilter}
              options={[
                { value: "all", label: "All Levels" },
                { value: "easy", label: "Easy" },
                { value: "medium", label: "Medium" },
                { value: "hard", label: "Hard" },
              ]}
            />
          </div>
          <div className="min-w-[140px] flex-1 max-w-[200px]">
            <FilterDropdown
              label="Topic"
              value={tagFilter}
              onChange={setTagFilter}
              options={[
                { value: "all", label: "All Topics" },
                ...allTags.map((tag) => ({ value: tag, label: tag })),
              ]}
            />
          </div>
          <div className="min-w-[140px] flex-1 max-w-[200px]">
            <FilterDropdown
              label="Sort By"
              value={sortBy}
              onChange={setSortBy}
              options={[
                { value: "newest", label: "Newest First" },
                { value: "oldest", label: "Oldest First" },
                { value: "az", label: "A - Z" },
                { value: "za", label: "Z - A" },
              ]}
            />
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
            {filteredQuestions.map((question) => (
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
