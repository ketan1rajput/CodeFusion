const Practice = () => {
  const questions = [
    { id: "1", title: "Change Button Text on Click", difficulty: "easy" },
    { id: "2", title: "Center a Div Using Flexbox", difficulty: "easy" },
    { id: "3", title: "Toggle Dark Mode", difficulty: "medium" },
    { id: "4", title: "Build a Modal Component", difficulty: "hard" },
  ];

  const grouped = {
    easy: questions.filter((q) => q.difficulty === "easy"),
    medium: questions.filter((q) => q.difficulty === "medium"),
    hard: questions.filter((q) => q.difficulty === "hard"),
  };

  const difficultyColor = {
    easy: "bg-green-500/20 text-green-400 border-green-500/30",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    hard: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  const renderSection = (title, data) => (
    <div className="mb-12">
      <h2 className="text-2xl font-semibold mb-6">{title}</h2>

      <div className="flex flex-wrap gap-6">
        {data.map((q) => (
          <div
            key={q.id}
            className="w-[260px] bg-[#141414] border border-[#222] rounded-xl p-6 
                       transition-all duration-300 ease-in-out
                       hover:scale-105 hover:shadow-lg hover:shadow-blue-500/10 
                       hover:border-blue-500/40 cursor-pointer"
          >
            <h4 className="text-lg font-medium mb-4">{q.title}</h4>

            <span
              className={`text-xs px-3 py-1 rounded-full border ${difficultyColor[q.difficulty]}`}
            >
              {q.difficulty.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="px-24 py-12 text-white min-h-screen bg-[#0f0f0f]">
      <h1 className="text-3xl font-bold mb-12">Practice Challenges</h1>

      {renderSection("🟢 Easy", grouped.easy)}
      {renderSection("🟡 Medium", grouped.medium)}
      {renderSection("🔴 Hard", grouped.hard)}
    </div>
  );
};

export default Practice;