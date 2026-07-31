import { Mail, MapPin } from "lucide-react";
import type { ProfileStat } from "@/mocks/profile";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";

interface ProfileUser {
  name: string;
  role: string;
  initials: string;
  email: string;
  location: string;
}

export function ProfileHeaderCard({ user, stats }: { user: ProfileUser; stats: ProfileStat[] }) {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="h-20 bg-gradient-to-r from-sky-400 to-blue-600" />
      <div className="flex flex-col items-center px-6 pb-6 text-center">
        <Avatar
          initials={user.initials}
          size="lg"
          className="-mt-10 bg-gradient-to-r from-sky-400 to-blue-600 text-white ring-4 ring-white"
        />
        <h2 className="mt-3 text-lg font-bold text-slate-900">{user.name}</h2>
        <p className="text-sm font-medium text-blue-600">{user.role}</p>

        <div className="mt-2 flex flex-col items-center gap-1 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            {user.email}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {user.location}
          </span>
        </div>

        <div className="mt-5 grid w-full grid-cols-3 gap-2 border-t border-slate-100 pt-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-lg font-bold text-blue-600">{stat.value}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
