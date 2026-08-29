"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { fetchMembers, updateMemberStatus, type Member } from "@/lib/api/members";
import { CreateMemberDialog } from "./CreateMemberDialog";
import { Plus, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export function MembersTable() {
  const [activeTab, setActiveTab] = useState("ativos");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const loadMembers = async () => {
    setLoading(true);
    try {
      // Passamos apenas_ativos=false para trazer todos e filtrar no frontend
      const data = await fetchMembers(false);
      setMembers(data);
    } catch (error) {
      console.error("Erro ao carregar membros:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const handleStatusChange = async (member: Member, newStatusVinculo: "ativo" | "vinculado" | "desligado") => {
    try {
      const isAtivo = newStatusVinculo !== "desligado";
      await updateMemberStatus(member.id, isAtivo, newStatusVinculo);
      setMembers(members.map(m => m.id === member.id ? { ...m, ativo: isAtivo, status_vinculo: newStatusVinculo } : m));
    } catch (error) {
      console.error("Erro ao atualizar status", error);
    }
  };

  const filteredMembers = members.filter(m => {
    if (activeTab === "ativos") return m.status_vinculo === "ativo";
    if (activeTab === "ex-membros") return m.status_vinculo === "desligado";
    if (activeTab === "vinculados") return m.status_vinculo === "vinculado";
    return true;
  });

  return (
    <Card className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          options={[
            { id: "ativos", label: "Ativos" },
            { id: "vinculados", label: "Vinculados" },
            { id: "ex-membros", label: "Ex-membros" },
          ]}
          value={activeTab}
          onChange={setActiveTab}
        />
        <Button onClick={() => setShowCreateDialog(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Novo Membro
        </Button>
      </div>

      {loading ? (
        <div className="flex py-12 justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">
                    Nenhum membro encontrado.
                  </td>
                </tr>
              ) : (
                filteredMembers.map(m => (
                  <tr key={m.id} className="transition-colors hover:bg-slate-50/50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{m.nome}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">{m.email}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {m.status_vinculo === "ativo" && <Badge tone="success">Ativo</Badge>}
                      {m.status_vinculo === "vinculado" && <Badge tone="info">Vinculado</Badge>}
                      {m.status_vinculo === "desligado" && <Badge tone="neutral">Desligado</Badge>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <select 
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={m.status_vinculo}
                        onChange={(e) => handleStatusChange(m, e.target.value as "ativo" | "vinculado" | "desligado")}
                      >
                        <option value="ativo">Ativo</option>
                        <option value="vinculado">Vinculado</option>
                        <option value="desligado">Desligado</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showCreateDialog && (
        <CreateMemberDialog 
          onClose={() => setShowCreateDialog(false)} 
          onSuccess={() => {
            setShowCreateDialog(false);
            loadMembers();
          }} 
        />
      )}
    </Card>
  );
}
