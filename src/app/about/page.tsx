"use client";

import AppShell from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import Card from "@/components/ui/Card";

const teamMembers = [
  {
    name: "محمد إبراهيم الديلمي",
    role: "قائد فريق الأمن السيبراني",
    org: "جامعة ذمار",
    color: "from-blue-600 to-indigo-700",
    initial: "م",
  },
  {
    name: "أحمد الهيدمة",
    role: "طالب في الأمن السيبراني",
    org: "المستوى الثاني",
    color: "from-emerald-500 to-teal-600",
    initial: "أ",
  },
  {
    name: "عبدالجليل الجبلي",
    role: "طالب في الأمن السيبراني",
    org: "المستوى الثاني",
    color: "from-violet-500 to-purple-600",
    initial: "ع",
  },
  {
    name: "أسامة شرهان",
    role: "طالب في الأمن السيبراني",
    org: "المستوى الثاني",
    color: "from-amber-500 to-orange-600",
    initial: "أ",
  },
  {
    name: "قناف العجيبي",
    role: "طالب في الأمن السيبراني",
    org: "المستوى الثاني",
    color: "from-rose-500 to-pink-600",
    initial: "ق",
  },
];

export default function AboutPage() {
  return (
    <AppShell>
      <PageHeader
        title="فريق التطوير"
        description="فريق طليعة الأمن السيبراني"
        backButton
      />

      <div className="space-y-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 text-center shadow-2xl shadow-blue-500/25">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMC0zMHY2aDZ2LTZoLTZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
          <div className="relative z-10">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/10 backdrop-blur-sm border-2 border-white/20 flex items-center justify-center shadow-xl">
              <svg className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              فريق طليعة الأمن السيبراني
            </h2>
            <p className="text-blue-200 font-semibold text-xl tracking-wide">
              CYBER VANGUARD
            </p>
            <p className="text-blue-300/80 mt-3">
              جامعة ذمار — كلية الحاسبات والمعلوماتية
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamMembers.map((member, index) => (
            <div
              key={index}
              className="group relative"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500 ${member.color}" />
              <Card className="relative overflow-hidden border border-gray-100 dark:border-slate-700 group-hover:border-transparent transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-gray-200/50 dark:group-hover:shadow-slate-700/50 group-hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity duration-50 rounded-bl-full ${member.color}" />
                <div className="relative p-6">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${member.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <span className="text-2xl font-bold text-white">{member.initial}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                    {member.name}
                  </h3>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">{member.role}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{member.org}</p>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </Card>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
