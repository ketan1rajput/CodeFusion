import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const difficultyStyles = {
  easy: "text-emerald-200 bg-emerald-400/10 border-emerald-300/20",
  medium: "text-amber-100 bg-amber-400/10 border-amber-300/20",
  hard: "text-rose-100 bg-rose-400/10 border-rose-300/20",
};

function StatCard({ label, value, caption }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
        {label}
      </p>
      <p className="mt-4 text-4xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm text-slate-400">{caption}</p>
    </article>
  );
}

const Dashboard = () => {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProgress = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/frontend-questions/progress`,
        { withCredentials: true }
      );
      setProgress(response.data?.data || null);
    } catch (requestError) {
      const status = requestError.response?.status;
      setError(
        [401, 403].includes(status)
          ? "Your session has expired. Sign in again to view your practice analytics."
          : requestError.response?.data?.message ||
              "Unable to load your practice analytics right now."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  return (
    <main className="min-h-[calc(100vh-80px)] bg-[#081120] px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/70">
              Your progress
            </p>
            <h1 className="text-3xl font-semibold sm:text-4xl">Practice dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Track the frontend challenges you have completed and see what is next.
            </p>
          </div>
          <Link
            to="/practice"
            className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Browse challenges
          </Link>
        </header>

        {loading && (
          <div role="status" className="rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-300">
            Loading your progress...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-rose-300/20 bg-rose-400/10 p-5 text-rose-100">
            <p>{error}</p>
            {error.startsWith("Your session has expired") && (
              <Link
                to="/"
                className="mt-4 inline-flex rounded-lg border border-rose-200/20 px-4 py-2 text-sm font-medium hover:bg-rose-200/10"
              >
                Sign in
              </Link>
            )}
            <button
              type="button"
              onClick={fetchProgress}
              className="mt-4 rounded-lg border border-rose-200/20 px-4 py-2 text-sm font-medium hover:bg-rose-200/10"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && progress && (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Solved"
                value={progress.solvedCount}
                caption="Challenges passed"
              />
              <StatCard
                label="Available"
                value={progress.totalQuestions}
                caption="Frontend challenges"
              />
              <StatCard
                label="Remaining"
                value={progress.remainingCount}
                caption="Challenges left to complete"
              />
              <StatCard
                label="Completion"
                value={`${progress.completionRate}%`}
                caption="Of all available challenges"
              />
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-lg font-semibold text-white">By difficulty</h2>
                <div className="mt-5 space-y-5">
                  {Object.entries(progress.difficultyBreakdown || {}).map(
                    ([difficulty, counts]) => {
                      const percent = counts.total
                        ? Math.round((counts.solved / counts.total) * 100)
                        : 0;
                      return (
                        <div key={difficulty}>
                          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                            <span className="capitalize text-slate-200">{difficulty}</span>
                            <span className="text-slate-400">
                              {counts.solved} / {counts.total}
                            </span>
                          </div>
                          <div
                            className="h-2 overflow-hidden rounded-full bg-slate-800"
                            role="progressbar"
                            aria-label={`${difficulty} challenges completed`}
                            aria-valuemin={0}
                            aria-valuemax={counts.total}
                            aria-valuenow={counts.solved}
                          >
                            <div
                              className="h-full rounded-full bg-cyan-300 transition-all"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </article>

              <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-white">Recently completed</h2>
                  <span className="text-xs text-slate-400">
                    {progress.recentCompletions.length} latest
                  </span>
                </div>
                {progress.recentCompletions.length === 0 ? (
                  <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-black/10 p-5">
                    <p className="text-sm text-slate-300">
                      Your first solved challenge will show up here.
                    </p>
                    <Link
                      to="/practice"
                      className="mt-4 inline-flex text-sm font-semibold text-cyan-200 hover:text-cyan-100"
                    >
                      Start practicing →
                    </Link>
                  </div>
                ) : (
                  <div className="mt-4 divide-y divide-white/5">
                    {progress.recentCompletions.map((completion) => (
                      <Link
                        key={completion.questionId}
                        to={`/practice/${completion.questionId}`}
                        className="flex flex-wrap items-center justify-between gap-3 py-4 transition hover:text-cyan-100"
                      >
                        <span className="font-medium text-slate-100">
                          {completion.title}
                        </span>
                        <span className="flex items-center gap-3">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
                              difficultyStyles[completion.difficulty] ||
                              difficultyStyles.easy
                            }`}
                          >
                            {completion.difficulty}
                          </span>
                          <time className="text-xs text-slate-400">
                            {new Date(completion.completedAt).toLocaleDateString()}
                          </time>
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </article>
            </section>
          </>
        )}
      </div>
    </main>
  );
};

export default Dashboard;
