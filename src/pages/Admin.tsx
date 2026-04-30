import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  ArrowLeft, Clock, FileText, KeyRound, Mail, Pause, Play, Plus, RefreshCw, Search, Trash2, UserPlus,
} from "lucide-react";

const ADMIN_EMAIL = "rangelmaker@gmail.com";

type Row = {
  email: string;
  buyer_name: string | null;
  status_compra: string | null;
  subscription_status: string | null;
  payment_gateway: string | null;
  hotmart_transaction?: string | null;
  hotmart_product_id?: string | null;
  hoopay_order_id?: number | null;
  amount?: number | null;
  last_payment_at?: string | null;
  subscription_expires_at?: string | null;
  raw_payload?: any;
  created_at?: string | null;
  updated_at?: string | null;
  has_account: boolean;
  user_id: string | null;
  last_sign_in_at: string | null;
  account_created_at: string | null;
  orphan?: boolean;
};

async function callAdmin(action: string, payload: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke("admin-actions", {
    body: { action, ...payload },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
}

function formatDate(d?: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return "—";
  }
}

function StatusBadge({ row }: { row: Row }) {
  if (row.orphan) return <Badge variant="outline">Sem compra</Badge>;
  const active = row.subscription_status === "active" && row.status_compra === "PURCHASE_COMPLETE";
  if (active) return <Badge className="bg-emerald-600 hover:bg-emerald-600">Ativo</Badge>;
  if (row.subscription_status === "canceled" || row.status_compra === "revogado")
    return <Badge variant="destructive">Pausado</Badge>;
  return <Badge variant="secondary">{row.status_compra || "—"}</Badge>;
}

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [busyEmail, setBusyEmail] = useState<string | null>(null);

  const [emailDialog, setEmailDialog] = useState<{ open: boolean; row: Row | null; newEmail: string }>(
    { open: false, row: null, newEmail: "" },
  );
  const [addDialog, setAddDialog] = useState({ open: false, email: "", name: "" });
  const [confirmRemove, setConfirmRemove] = useState<Row | null>(null);
  const [receiptRow, setReceiptRow] = useState<Row | null>(null);

  // Bloqueio de acesso
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }
    if (user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      toast.error("Acesso restrito ao administrador.");
      navigate("/", { replace: true });
    }
  }, [user, authLoading, navigate]);

  async function load() {
    setLoading(true);
    try {
      const data = await callAdmin("list");
      const merged: Row[] = [...(data.rows || []), ...(data.orphans || [])];
      setRows(merged);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.email?.toLowerCase().includes(q) ||
        r.buyer_name?.toLowerCase().includes(q) ||
        r.hotmart_transaction?.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const stats = useMemo(() => {
    const total = rows.length;
    const ativos = rows.filter(
      (r) => r.subscription_status === "active" && r.status_compra === "PURCHASE_COMPLETE",
    ).length;
    const pausados = rows.filter(
      (r) => r.subscription_status === "canceled" || r.status_compra === "revogado",
    ).length;
    const semConta = rows.filter((r) => !r.has_account && !r.orphan).length;
    return { total, ativos, pausados, semConta };
  }, [rows]);

  async function doAction(action: string, row: Row, extra: Record<string, unknown> = {}) {
    setBusyEmail(row.email);
    try {
      await callAdmin(action, { email: row.email, ...extra });
      if (action === "delete_user") {
        toast.success("Usuário excluído com sucesso.");
      } else {
        toast.success("Pronto!");
      }
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setBusyEmail(null);
    }
  }

  async function handleChangeEmail() {
    const row = emailDialog.row;
    if (!row) return;
    const newEmail = emailDialog.newEmail.trim().toLowerCase();
    if (!newEmail || !/^\S+@\S+\.\S+$/.test(newEmail)) {
      toast.error("Email inválido");
      return;
    }
    setBusyEmail(row.email);
    try {
      await callAdmin("change_email", { oldEmail: row.email, newEmail });
      toast.success(`Email alterado para ${newEmail}`);
      setEmailDialog({ open: false, row: null, newEmail: "" });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao trocar email");
    } finally {
      setBusyEmail(null);
    }
  }

  async function handleResetPassword(row: Row) {
    setBusyEmail(row.email);
    try {
      await callAdmin("send_password_reset", {
        email: row.email,
        redirectTo: `${window.location.origin}/auth`,
      });
      toast.success("Email de reset enviado.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setBusyEmail(null);
    }
  }

  async function handleAddBuyer() {
    const email = addDialog.email.trim().toLowerCase();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Email inválido");
      return;
    }
    try {
      await callAdmin("add_buyer", { email, buyerName: addDialog.name || null });
      toast.success("Comprador adicionado.");
      setAddDialog({ open: false, email: "", name: "" });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  }

  async function handleGrantTrial(row: Row, days: number) {
    setBusyEmail(row.email);
    try {
      await callAdmin("grant_trial", { email: row.email, days });
      toast.success(`Acesso liberado por ${days} dias para ${row.email}.`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao liberar acesso");
    } finally {
      setBusyEmail(null);
    }
  }

  async function handleRemove(row: Row) {
    setBusyEmail(row.email);
    try {
      await callAdmin("remove_buyer", { email: row.email });
      toast.success("Removido da lista de aprovados.");
      setConfirmRemove(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setBusyEmail(null);
    }
  }

  if (authLoading || user?.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Verificando acesso…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Painel Admin</h1>
              <p className="text-xs text-muted-foreground">Gerenciamento de usuários e acessos</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Total</div><div className="text-2xl font-semibold">{stats.total}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Ativos</div><div className="text-2xl font-semibold text-emerald-600">{stats.ativos}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Pausados</div><div className="text-2xl font-semibold text-destructive">{stats.pausados}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Sem cadastro</div><div className="text-2xl font-semibold">{stats.semConta}</div></CardContent></Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
            <div>
              <CardTitle>Usuários</CardTitle>
              <CardDescription>Compradores aprovados e contas no app</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar por email, nome ou transação…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 w-72"
                />
              </div>
              <Button onClick={() => setAddDialog({ open: true, email: "", name: "" })}>
                <UserPlus className="h-4 w-4 mr-1" /> Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Conta</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Vence em</TableHead>
                    <TableHead>Último login</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Carregando…</TableCell></TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum usuário encontrado</TableCell></TableRow>
                  ) : (
                    filtered.map((row) => {
                      const isActive = row.subscription_status === "active" && row.status_compra === "PURCHASE_COMPLETE";
                      const busy = busyEmail === row.email;
                      return (
                        <TableRow key={row.email + (row.user_id ?? "")}>
                          <TableCell className="font-medium">{row.email}</TableCell>
                          <TableCell className="text-muted-foreground">{row.buyer_name || "—"}</TableCell>
                          <TableCell><StatusBadge row={row} /></TableCell>
                          <TableCell>
                            {row.has_account ? (
                              <Badge variant="outline" className="text-emerald-600 border-emerald-600/40">Sim</Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">Não</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{formatDate(row.last_payment_at)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{row.subscription_expires_at ? formatDate(row.subscription_expires_at) : <span className="italic">sem vencimento</span>}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{formatDate(row.last_sign_in_at)}</TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1 flex-wrap">
                              {!row.orphan && (
                                <Button size="sm" variant="outline" disabled={busy} onClick={() => setReceiptRow(row)}>
                                  <FileText className="h-3.5 w-3.5 mr-1" /> Comprovante
                                </Button>
                              )}
                              {!row.orphan && (
                                isActive ? (
                                  <Button size="sm" variant="outline" disabled={busy} onClick={() => doAction("pause", row)}>
                                    <Pause className="h-3.5 w-3.5 mr-1" /> Pausar
                                  </Button>
                                ) : (
                                  <Button size="sm" variant="outline" disabled={busy} onClick={() => doAction("resume", row)}>
                                    <Play className="h-3.5 w-3.5 mr-1" /> Liberar
                                  </Button>
                                )
                              )}
                              <Button size="sm" variant="outline" disabled={busy} onClick={() => setEmailDialog({ open: true, row, newEmail: "" })}>
                                <Mail className="h-3.5 w-3.5 mr-1" /> Email
                              </Button>
                              {row.has_account && (
                                <Button size="sm" variant="outline" disabled={busy} onClick={() => handleResetPassword(row)}>
                                  <KeyRound className="h-3.5 w-3.5 mr-1" /> Senha
                                </Button>
                              )}
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                disabled={busy} 
                                onClick={() => {
                                  if (row.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
                                    toast.error("Não é possível excluir o próprio administrador.");
                                    return;
                                  }
                                  if (confirm(`Tem certeza que deseja excluir permanentemente o usuário ${row.email}? Esta ação não pode ser desfeita.`)) {
                                    doAction("delete_user", row);
                                  }
                                }} 
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Dialog: trocar email */}
      <Dialog open={emailDialog.open} onOpenChange={(o) => !o && setEmailDialog({ open: false, row: null, newEmail: "" })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trocar email</DialogTitle>
            <DialogDescription>
              Atualiza o email em todos os lugares (login, compradores, perfil). Os dados do usuário são preservados.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Email atual</Label>
              <Input value={emailDialog.row?.email || ""} disabled />
            </div>
            <div>
              <Label>Novo email</Label>
              <Input
                type="email"
                placeholder="novo@email.com"
                value={emailDialog.newEmail}
                onChange={(e) => setEmailDialog((s) => ({ ...s, newEmail: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialog({ open: false, row: null, newEmail: "" })}>Cancelar</Button>
            <Button onClick={handleChangeEmail}>Confirmar troca</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: adicionar comprador */}
      <Dialog open={addDialog.open} onOpenChange={(o) => !o && setAddDialog({ open: false, email: "", name: "" })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar comprador manual</DialogTitle>
            <DialogDescription>
              Libera acesso ao app para um email específico (gateway: manual).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Email *</Label>
              <Input type="email" value={addDialog.email} onChange={(e) => setAddDialog((s) => ({ ...s, email: e.target.value }))} />
            </div>
            <div>
              <Label>Nome (opcional)</Label>
              <Input value={addDialog.name} onChange={(e) => setAddDialog((s) => ({ ...s, name: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog({ open: false, email: "", name: "" })}>Cancelar</Button>
            <Button onClick={handleAddBuyer}><Plus className="h-4 w-4 mr-1" /> Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: comprovante / detalhes do pagamento */}
      <Dialog open={!!receiptRow} onOpenChange={(o) => !o && setReceiptRow(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> Comprovante de pagamento
            </DialogTitle>
            <DialogDescription>
              Detalhes do pagamento e da assinatura do usuário.
            </DialogDescription>
          </DialogHeader>
          {receiptRow && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">Email</div>
                  <div className="font-medium break-all">{receiptRow.email}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Nome</div>
                  <div className="font-medium">{receiptRow.buyer_name || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Status</div>
                  <div><StatusBadge row={receiptRow} /></div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Gateway</div>
                  <div className="font-medium">{receiptRow.payment_gateway || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Valor</div>
                  <div className="font-medium">
                    {receiptRow.amount != null ? `R$ ${Number(receiptRow.amount).toFixed(2)}` : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Transação</div>
                  <div className="font-mono text-xs break-all">
                    {receiptRow.hotmart_transaction || receiptRow.hoopay_order_id || "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Início (último pagamento)</div>
                  <div className="font-medium">{formatDate(receiptRow.last_payment_at)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Vencimento</div>
                  <div className="font-medium">
                    {receiptRow.subscription_expires_at ? formatDate(receiptRow.subscription_expires_at) : "Sem vencimento"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Criado em</div>
                  <div className="font-medium">{formatDate(receiptRow.created_at)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Atualizado em</div>
                  <div className="font-medium">{formatDate(receiptRow.updated_at)}</div>
                </div>
              </div>
              {receiptRow.raw_payload && (
                <details className="rounded border border-border p-2">
                  <summary className="cursor-pointer text-xs text-muted-foreground">Payload bruto do gateway</summary>
                  <pre className="mt-2 max-h-64 overflow-auto rounded bg-muted/40 p-2 text-[10px]">
                    {JSON.stringify(receiptRow.raw_payload, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiptRow(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm remove */}
      <AlertDialog open={!!confirmRemove} onOpenChange={(o) => !o && setConfirmRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover da lista de aprovados?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso apaga o registro de <strong>{confirmRemove?.email}</strong> em compradores aprovados.
              A conta de login (se existir) NÃO será excluída — ela só perderá o acesso ao app.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmRemove && handleRemove(confirmRemove)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
