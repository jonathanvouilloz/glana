'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

interface Theme {
  id: string;
  name: string;
  color: string;
  tweetCount: number;
}

interface Stats {
  totalTweets: number;
  totalThemes: number;
  unclassifiedCount: number;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    // Charger les thèmes et stats
    fetch('/api/themes')
      .then(res => res.json())
      .then(data => {
        if (data.success !== false) {
          setThemes(data.themes || []);
        }
      })
      .catch(console.error);

    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        if (data.success !== false) {
          setStats(data);
        }
      })
      .catch(console.error);
  }, [pathname]);

  const navItems = [
    { href: '/dashboard', label: 'All Tweets', icon: '📚', count: stats?.totalTweets },
    { href: '/dashboard/favorites', label: 'Favorites', icon: '⭐' },
    { href: '/dashboard/unclassified', label: 'Unclassified', icon: '📥', count: stats?.unclassifiedCount },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-[#141414] border-r border-[#27272a] flex flex-col transition-all duration-200`}>
        {/* Logo */}
        <div className="p-4 border-b border-[#27272a] flex items-center justify-between">
          <Link href="/dashboard" className={`text-xl font-bold text-[#A300D9] ${!sidebarOpen && 'hidden'}`}>
            Glana
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-[#27272a] rounded-lg text-[#a1a1aa]"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                pathname === item.href
                  ? 'bg-[#A300D9]/20 text-[#A300D9]'
                  : 'text-[#a1a1aa] hover:bg-[#27272a] hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              {sidebarOpen && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {item.count !== undefined && (
                    <span className="text-xs bg-[#27272a] px-2 py-0.5 rounded-full">
                      {item.count}
                    </span>
                  )}
                </>
              )}
            </Link>
          ))}

          {/* Themes section */}
          {sidebarOpen && themes.length > 0 && (
            <>
              <div className="pt-4 pb-2 px-3 text-xs text-[#52525b] uppercase tracking-wider">
                Themes
              </div>
              {themes.map(theme => (
                <Link
                  key={theme.id}
                  href={`/dashboard/themes/${theme.id}`}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    pathname === `/dashboard/themes/${theme.id}`
                      ? 'bg-[#A300D9]/20 text-[#A300D9]'
                      : 'text-[#a1a1aa] hover:bg-[#27272a] hover:text-white'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: theme.color }}
                  />
                  <span className="flex-1 truncate">{theme.name}</span>
                  <span className="text-xs bg-[#27272a] px-2 py-0.5 rounded-full">
                    {theme.tweetCount}
                  </span>
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* Settings */}
        <div className="p-3 border-t border-[#27272a]">
          <Link
            href="/dashboard/settings"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              pathname === '/dashboard/settings'
                ? 'bg-[#A300D9]/20 text-[#A300D9]'
                : 'text-[#a1a1aa] hover:bg-[#27272a] hover:text-white'
            }`}
          >
            <span>⚙️</span>
            {sidebarOpen && <span>Settings</span>}
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
