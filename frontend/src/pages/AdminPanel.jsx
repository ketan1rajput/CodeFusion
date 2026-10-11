import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";

const EMPTY_QUESTION = {
  title: "",
  description: "",
  difficulty: "easy",
  starter_html: "",
  starter_css: "",
  starter_js: "",
  test_cases: "[]",
};

const difficultyClasses = {
  easy: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  medium: "border-amber-400/30 bg-amber-400/10 text-amber-100",
  hard: "border-rose-400/30 bg-rose-400/10 text-rose-100",
};

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const currentUserId = useSelector((state) => state.user.userId);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState(EMPTY_QUESTION);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (activeTab === "users") {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/admin/show-users`,
          { withCredentials: true }
        );
        setUsers(response.data?.data || []);
      } else {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/admin/get-questions`,
          { withCredentials: true }
        );
        setQuestions(response.data?.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function resetQuestionForm() {
    setNewQuestion(EMPTY_QUESTION);
    setEditingQuestionId(null);
    setShowAddQuestion(false);
  }

  function startEditingQuestion(question) {
    setNewQuestion({
      title: question.title || "",
      description: question.description || "",
      difficulty: question.difficulty || "easy",
      starter_html: question.starter_html || "",
      starter_css: question.starter_css || "",
      starter_js: question.starter_js || "",
      test_cases: JSON.stringify(question.test_cases || [], null, 2),
    });
    setEditingQuestionId(question.id);
    setShowAddQuestion(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Delete this user and their saved code and practice submissions?")) return;
    
    try {
      setError("");
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/delete-user`,
        {
          data: { id: userId },
          withCredentials: true,
        }
      );
      await fetchData();
      setSuccess("User deleted successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete user");
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm("Delete this question and its saved practice submissions?")) return;
    
    try {
      setError("");
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/delete-question`,
        {
          data: { id: questionId },
          withCredentials: true,
        }
      );
      await fetchData();
      setSuccess("Question deleted successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete question");
    }
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    let testCases;

    try {
      testCases = JSON.parse(newQuestion.test_cases);
      if (!Array.isArray(testCases)) {
        throw new Error("Test cases must be a JSON array.");
      }
    } catch {
      setError("Test cases must be valid JSON in an array, such as [].");
      return;
    }

    const payload = { ...newQuestion, test_cases: testCases };
    const isEditing = Boolean(editingQuestionId);

    try {
      setIsSaving(true);
      if (isEditing) {
        await axios.put(
          `${import.meta.env.VITE_BACKEND_URL}/api/admin/update-question`,
          { ...payload, id: editingQuestionId },
          { withCredentials: true }
        );
      } else {
        await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/admin/post-question`,
          payload,
          { withCredentials: true }
        );
      }
      resetQuestionForm();
      await fetchData();
      setSuccess(isEditing ? "Question updated successfully." : "Question created successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save question.");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess("");
        setError("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  return (
    <div className="min-h-screen bg-[#081120] px-6 py-10 text-white md:px-12 xl:px-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <p className="mb-3 text-sm uppercase tracking-[0.35em] text-cyan-200/70">
            Admin Console
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-slate-50">
            Manage users and questions
          </h1>
        </div>

        {success && (
          <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-emerald-100">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-rose-100">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-8 flex gap-2">
          <button
            onClick={() => setActiveTab("users")}
            className={`rounded-xl px-6 py-3 font-semibold transition ${
              activeTab === "users"
                ? "bg-cyan-400 text-slate-950"
                : "border border-white/10 bg-white/5 text-slate-300 hover:border-cyan-300/30"
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab("questions")}
            className={`rounded-xl px-6 py-3 font-semibold transition ${
              activeTab === "questions"
                ? "bg-cyan-400 text-slate-950"
                : "border border-white/10 bg-white/5 text-slate-300 hover:border-cyan-300/30"
            }`}
          >
            Questions
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.95),rgba(8,17,32,0.92))] p-6">
            {loading ? (
              <div className="p-10 text-slate-300">Loading users...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="pb-4 text-left text-xs uppercase tracking-[0.2em] text-slate-400">
                        Username
                      </th>
                      <th className="pb-4 text-left text-xs uppercase tracking-[0.2em] text-slate-400">
                        Email
                      </th>
                      <th className="pb-4 text-left text-xs uppercase tracking-[0.2em] text-slate-400">
                        Admin
                      </th>
                      <th className="pb-4 text-right text-xs uppercase tracking-[0.2em] text-slate-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="py-10 text-center text-slate-400">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr
                          key={user.id}
                          className="border-b border-white/5 hover:bg-white/5"
                        >
                          <td className="py-4 text-slate-200">{user.username}</td>
                          <td className="py-4 text-slate-300">{user.email}</td>
                          <td className="py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                                user.isAdmin
                                  ? "border border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
                                  : "border border-white/10 bg-white/5 text-slate-400"
                              }`}
                            >
                              {user.isAdmin ? "Admin" : "User"}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={Number(user.id) === Number(currentUserId)}
                              title={Number(user.id) === Number(currentUserId) ? "You cannot delete your own account" : "Delete user"}
                              className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-sm text-rose-200 transition hover:bg-rose-400/20"
                            >
                              {Number(user.id) === Number(currentUserId) ? "Current admin" : "Delete"}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Questions Tab */}
        {activeTab === "questions" && (
          <div>
            <div className="mb-6 flex justify-end">
              <button
                onClick={() => {
                  if (showAddQuestion) {
                    resetQuestionForm();
                  } else {
                    setNewQuestion(EMPTY_QUESTION);
                    setEditingQuestionId(null);
                    setShowAddQuestion(true);
                  }
                }}
                className="rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                {showAddQuestion ? "Cancel" : "Add Question"}
              </button>
            </div>

            {/* Add Question Form */}
            {showAddQuestion && (
              <div className="mb-8 rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.95),rgba(8,17,32,0.92))] p-6">
                  <h2 className="mb-6 text-xl font-semibold text-slate-50">
                  {editingQuestionId ? "Edit Question" : "Create New Question"}
                </h2>
                <form onSubmit={handleSaveQuestion} className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">
                        Title
                      </label>
                      <input
                        type="text"
                        value={newQuestion.title}
                        onChange={(e) =>
                          setNewQuestion({ ...newQuestion, title: e.target.value })
                        }
                        required
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white transition hover:border-cyan-300/30 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
                        placeholder="Question title"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">
                        Difficulty
                      </label>
                      <select
                        value={newQuestion.difficulty}
                        onChange={(e) =>
                          setNewQuestion({
                            ...newQuestion,
                            difficulty: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white transition hover:border-cyan-300/30 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">
                      Description
                    </label>
                    <textarea
                      value={newQuestion.description}
                      onChange={(e) =>
                        setNewQuestion({
                          ...newQuestion,
                          description: e.target.value,
                        })
                      }
                      required
                      rows={4}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white transition hover:border-cyan-300/30 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
                      placeholder="Question description"
                    />
                  </div>

                  <div className="grid gap-6 md:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">
                        Starter HTML
                      </label>
                      <textarea
                        value={newQuestion.starter_html}
                        onChange={(e) =>
                          setNewQuestion({
                            ...newQuestion,
                            starter_html: e.target.value,
                          })
                        }
                        rows={3}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white transition hover:border-cyan-300/30 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
                        placeholder="<div>...</div>"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">
                        Starter CSS
                      </label>
                      <textarea
                        value={newQuestion.starter_css}
                        onChange={(e) =>
                          setNewQuestion({
                            ...newQuestion,
                            starter_css: e.target.value,
                          })
                        }
                        rows={3}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white transition hover:border-cyan-300/30 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
                        placeholder=".class { ... }"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">
                        Starter JavaScript
                      </label>
                      <textarea
                        value={newQuestion.starter_js}
                        onChange={(e) =>
                          setNewQuestion({
                            ...newQuestion,
                            starter_js: e.target.value,
                          })
                        }
                        rows={3}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white transition hover:border-cyan-300/30 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
                        placeholder="function() { ... }"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">
                      Test Cases (JSON array)
                    </label>
                    <textarea
                      value={newQuestion.test_cases}
                      onChange={(e) =>
                        setNewQuestion({
                          ...newQuestion,
                          test_cases: e.target.value,
                        })
                      }
                      required
                      rows={6}
                      spellCheck="false"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm text-white transition hover:border-cyan-300/30 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
                      placeholder={'[{"selector":"#app","mustExist":true}]'}
                    />
                    <p className="mt-2 text-xs text-slate-400">
                      Use the same selector and interaction format as the practice test runner.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
                  >
                    {isSaving ? "Saving..." : editingQuestionId ? "Save Changes" : "Create Question"}
                  </button>
                </form>
              </div>
            )}

            {/* Questions List */}
            <div className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.95),rgba(8,17,32,0.92))] p-6">
              {loading ? (
                <div className="p-10 text-slate-300">Loading questions...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="pb-4 text-left text-xs uppercase tracking-[0.2em] text-slate-400">
                          Title
                        </th>
                        <th className="pb-4 text-left text-xs uppercase tracking-[0.2em] text-slate-400">
                          Difficulty
                        </th>
                        <th className="pb-4 text-left text-xs uppercase tracking-[0.2em] text-slate-400">
                          Created
                        </th>
                        <th className="pb-4 text-right text-xs uppercase tracking-[0.2em] text-slate-400">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {questions.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="py-10 text-center text-slate-400">
                            No questions found
                          </td>
                        </tr>
                      ) : (
                        questions.map((question) => (
                          <tr
                            key={question.id}
                            className="border-b border-white/5 hover:bg-white/5"
                          >
                            <td className="py-4 text-slate-200">{question.title}</td>
                            <td className="py-4">
                              <span
                                className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                                  difficultyClasses[question.difficulty] ||
                                  difficultyClasses.easy
                                }`}
                              >
                                {question.difficulty}
                              </span>
                            </td>
                            <td className="py-4 text-slate-300">
                              {question.created_at
                                ? new Date(question.created_at).toLocaleDateString()
                                : "N/A"}
                            </td>
                            <td className="py-4 text-right">
                              <button
                                type="button"
                                onClick={() => startEditingQuestion(question)}
                                className="mr-2 rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100 transition hover:bg-cyan-300/20"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteQuestion(question.id)}
                                className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-sm text-rose-200 transition hover:bg-rose-400/20"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
