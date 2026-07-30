export default function Loading() {
  return (
    <div className="bg-[#F8FAFC] min-h-[calc(100vh-120px)] p-4 flex flex-col gap-4 animate-pulse max-w-md mx-auto pt-6">
      <div className="h-12 bg-slate-200/50 rounded-xl w-full"></div>
      <div className="h-64 bg-slate-200/50 rounded-2xl w-full mt-4"></div>
      <div className="grid grid-cols-2 gap-3 mt-2">
        <div className="h-28 bg-slate-200/50 rounded-2xl w-full"></div>
        <div className="h-28 bg-slate-200/50 rounded-2xl w-full"></div>
        <div className="h-28 bg-slate-200/50 rounded-2xl w-full"></div>
        <div className="h-28 bg-slate-200/50 rounded-2xl w-full"></div>
      </div>
    </div>
  );
}

