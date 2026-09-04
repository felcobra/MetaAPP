"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { Input } from "@/components/ui/Input";
import { fetchMembers, updateMemberStatus, type Member } from "@/lib/api/members";
import { CreateMemberDialog } from "./CreateMemberDialog";
import { 
  Plus, 
  Loader2, 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  ChevronLeft, 
  ChevronRight,
  UserCheck,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

type SortOption = "name-asc" | "name-desc" | "id-desc" | "id-asc";

export function MembersTable() {
  const [activeTab, setActiveTab] = useState("ativos");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  // Filtros e ordenação
  const [search, setSearch] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("name-asc");
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  // Resetar página ao mudar aba ou busca
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search, sortOption, pageSize]);

  const handleStatusChange = async (member: Member, newStatusVinculo: "ativo" | "vinculado" | "desligado") => {
    try {
      const isAtivo = newStatusVinculo !== "desligado";
      await updateMemberStatus(member.id, isAtivo, newStatusVinculo);
      setMembers(prev => prev.map(m => m.id === member.id ? { ...m, ativo: isAtivo, status_vinculo: newStatusVinculo } : m));
    } catch (error) {
      console.error("Erro ao atualizar status", error);
    }
  };

  // Filtragem
  const filteredMembers = useMemo(() => {
    return members
      .filter(m => {
        const status = (m.status_vinculo || "ativo").trim().toLowerCase();

        // Filtro por aba
        if (activeTab === "ativos") {
          if (status !== "ativo") return false;
        } else if (activeTab === "vinculados") {
          if (status !== "vinculado") return false;
        } else if (activeTab === "ex-membros") {
          if (status !== "desligado") return false;
        }
        // activeTab === "todos" inclui todos

        // Filtro por busca (nome ou email)
        if (search.trim()) {
          const query = search.toLowerCase();
          const matchNome = (m.nome || "").toLowerCase().includes(query);
          const matchEmail = (m.email || "").toLowerCase().includes(query);
          if (!matchNome && !matchEmail) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOption === "name-asc") {
          return (a.nome || "").localeCompare(b.nome || "", "pt-BR", { sensitivity: "base" });
        }
        if (sortOption === "name-desc") {
          return (b.nome || "").localeCompare(a.nome || "", "pt-BR", { sensitivity: "base" });
        }
        if (sortOption === "id-desc") {
          return b.id - a.id;
        }
        if (sortOption === "id-asc") {
          return a.id - b.id;
        }
        return 0;
      });
  }, [members, activeTab, search, sortOption]);

  // Contadores por status para as abas
  const counts = useMemo(() => {
    return {
      ativos: members.filter(m => m.status_vinculo === "ativo").length,
      vinculados: members.filter(m => m.status_vinculo === "vinculado").length,
      exMembros: members.filter(m => m.status_vinculo === "desligado").length,
      todos: members.length,
    };
  }, [members]);

  // Cálculos de paginação
  const totalItems = filteredMembers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  
  const fromIndex = totalItems === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1;
  const toIndex = Math.min(validCurrentPage * pageSize, totalItems);

  const paginatedMembers = useMemo(() => {
    const start = (validCurrentPage - 1) * pageSize;
    return filteredMembers.slice(start, start + pageSize);
  }, [filteredMembers, validCurrentPage, pageSize]);

  // Gerador de régua de páginas
  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      
      let start = Math.max(2, validCurrentPage - 1);
      let end = Math.min(totalPages - 1, validCurrentPage + 1);

      if (validCurrentPage <= 3) {
        end = 4;
      } else if (validCurrentPage >= totalPages - 2) {
        start = totalPages - 3;
      }

      if (start > 2) pages.push("...");
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push("...");

      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, validCurrentPage]);

  // Alternar ordenação por nome ao clicar no cabeçalho
  const toggleNameSort = () => {
    if (sortOption === "name-asc") {
      setSortOption("name-desc");
    } else {
      setSortOption("name-asc");
    }
  };

  return (
    <Card className="flex flex-col gap-6 p-6">
      {/* Top Header: Tabs & Botão Novo Membro */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          options={[
            { id: "ativos", label: `Ativos (${counts.ativos})` },
            { id: "vinculados", label: `Vinculados (${counts.vinculados})` },
            { id: "ex-membros", label: `Ex-membros (${counts.exMembros})` },
            { id: "todos", label: `Todos (${counts.todos})` },
          ]}
          value={activeTab}
          onChange={setActiveTab}
        />
        <Button onClick={() => setShowCreateDialog(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Novo Membro
        </Button>
      </div>

      {/* Barra de Filtros: Busca, Ordenação e Tamanho de Página */}
      <div className="flex flex-col gap-3 rounded-xl bg-slate-50/80 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Input
            icon={<Search className="h-4 w-4" />}
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 text-sm bg-white"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              title="Limpar busca"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Seletor de Ordenação */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Ordem:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="name-asc">Nome (A → Z)</option>
              <option value="name-desc">Nome (Z → A)</option>
              <option value="id-desc">Mais recentes (ID ↓)</option>
              <option value="id-asc">Mais antigos (ID ↑)</option>
            </select>
          </div>

          {/* Itens por página */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Exibir:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="h-10 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabela de Membros */}
      {loading ? (
        <div className="flex py-16 flex-col items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-sm font-medium text-slate-500">Carregando membros...</span>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th 
                    className="cursor-pointer px-4 py-3.5 select-none hover:text-slate-900 transition-colors"
                    onClick={toggleNameSort}
                    title="Clique para ordenar por nome"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Nome</span>
                      {sortOption === "name-asc" ? (
                        <ArrowUp className="h-3.5 w-3.5 text-blue-600" />
                      ) : sortOption === "name-desc" ? (
                        <ArrowDown className="h-3.5 w-3.5 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3.5">Email</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {paginatedMembers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <UserCheck className="h-8 w-8 text-slate-300" />
                        <p className="font-medium text-slate-600">Nenhum membro encontrado.</p>
                        {search && (
                          <button
                            onClick={() => setSearch("")}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Limpar filtro de busca
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedMembers.map((m) => (
                    <tr key={m.id} className="transition-colors hover:bg-slate-50/70">
                      <td className="whitespace-nowrap px-4 py-3.5 font-semibold text-slate-900">
                        {m.nome}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-slate-500">
                        {m.email}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5">
                        {m.status_vinculo === "ativo" && <Badge tone="success">Ativo</Badge>}
                        {m.status_vinculo === "vinculado" && <Badge tone="info">Vinculado</Badge>}
                        {m.status_vinculo === "desligado" && <Badge tone="neutral">Desligado</Badge>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right">
                        <select
                          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                          value={m.status_vinculo}
                          onChange={(e) =>
                            handleStatusChange(
                              m,
                              e.target.value as "ativo" | "vinculado" | "desligado"
                            )
                          }
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

          {/* Barra de Paginação */}
          {totalItems > 0 && (
            <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 p-4 sm:flex-row">
              <span className="text-xs font-medium text-slate-500">
                Exibindo <span className="font-semibold text-slate-800">{fromIndex}</span> a{" "}
                <span className="font-semibold text-slate-800">{toIndex}</span> de{" "}
                <span className="font-semibold text-slate-800">{totalItems}</span> membros
              </span>

              <div className="flex items-center gap-1.5">
                {/* Botão Anterior */}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={validCurrentPage === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white"
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Botões Numéricos */}
                {pageNumbers.map((p, idx) => {
                  if (p === "...") {
                    return (
                      <span key={`ellipsis-${idx}`} className="px-1 text-xs font-bold text-slate-400">
                        ...
                      </span>
                    );
                  }
                  const pageNum = Number(p);
                  const isCurrent = pageNum === validCurrentPage;
                  return (
                    <button
                      key={`page-${pageNum}`}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`flex h-8 min-w-[32px] items-center justify-center rounded-lg px-2 text-xs font-bold transition-colors shadow-sm ${
                        isCurrent
                          ? "bg-blue-600 text-white shadow-blue-200"
                          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                {/* Botão Próximo */}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={validCurrentPage === totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white"
                  aria-label="Próxima página"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
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
