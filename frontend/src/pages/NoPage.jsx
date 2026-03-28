const NoPage = () => {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 text-center text-white">
      <div>
        <h1 className="text-4xl font-semibold">Page not found</h1>
        <p className="mt-4 text-slate-300">
          The route you requested does not exist in CodeFusion.
        </p>
      </div>
    </div>
  );
};

export default NoPage;
