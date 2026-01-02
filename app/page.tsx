export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold mb-4">
          <span className="text-[#A300D9]">Glana</span>
        </h1>
        <p className="text-xl text-[#a1a1aa] mb-8">
          Your personal tweet inspiration library
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/dashboard"
            className="px-6 py-3 bg-[#A300D9] text-white rounded-lg font-medium hover:bg-[#8a00b8] transition-colors"
          >
            Open Dashboard
          </a>
        </div>
        <div className="mt-16 grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-[#00D9A3]">-</div>
            <div className="text-sm text-[#a1a1aa]">Tweets saved</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[#00D9A3]">-</div>
            <div className="text-sm text-[#a1a1aa]">Themes</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[#00D9A3]">-</div>
            <div className="text-sm text-[#a1a1aa]">Favorites</div>
          </div>
        </div>
      </div>
    </main>
  );
}
