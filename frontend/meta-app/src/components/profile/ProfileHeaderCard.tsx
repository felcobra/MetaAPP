import type { SessionUser } from "@/types/user";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";

export function ProfileHeaderCard({ user }: { user: SessionUser }) {
  return (
    <Card className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-center sm:text-left">
      <Avatar initials={user.initials} size="lg" />
      <div className="flex-1">
        <h2 className="text-2xl font-bold text-slate-900">{user.name}</h2>
        <p className="text-sm text-slate-500">{user.role}</p>
        <p className="mt-1 text-sm text-blue-600">{user.email}</p>
      </div>
      <Button variant="secondary">Editar perfil</Button>
    </Card>
  );
}
