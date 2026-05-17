import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, CreditCard, ExternalLink, HelpCircle, Loader2, LogOut, Shield, Trash2, User as UserIcon, Save, Edit2 } from "lucide-react";
import { useAuth, STRIPE_MENSAL, STRIPE_ANUAL } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PricingModal } from "@/components/PricingModal";
import { toast } from "sonner";

const ADMIN_EMAIL = "rangelmaker@gmail.com";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export function UserAvatarMenu() {
  const { user, signOut, accessStatus, trialDaysRemaining } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const navigate = useNavigate();
  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.user_metadata?.display_name || "");
  const [savingName, setSavingName] = useState(false);

  const initials = (user?.user_metadata?.display_name || user?.email || "U")
    .split(" ")
    .filter(Boolean)
    .map((p: string) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Carrega avatar do profile
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled && !error && data?.avatar_url) {
        // Cache-bust para refletir trocas
        setAvatarUrl(`${data.avatar_url}?t=${Date.now()}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const handlePick = () => fileInputRef.current?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite reescolher o mesmo arquivo
    if (!file || !user?.id) return;

    if (!ALLOWED.includes(file.type)) {
      toast.error("Use uma imagem JPG, PNG ou WEBP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("A imagem precisa ter até 5MB.");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${user.id}/avatar.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = pub.publicUrl;

      const { error: updErr } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("user_id", user.id);
      if (updErr) throw updErr;

      setAvatarUrl(`${publicUrl}?t=${Date.now()}`);
      toast.success("Foto de perfil atualizada!");
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível enviar a foto. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!user?.id || !avatarUrl) return;
    setUploading(true);
    try {
      // tenta remover variantes comuns
      const candidates = ["avatar.png", "avatar.jpg", "avatar.jpeg", "avatar.webp"].map(
        (n) => `${user.id}/${n}`,
      );
      await supabase.storage.from("avatars").remove(candidates);

      const { error: updErr } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("user_id", user.id);
      if (updErr) throw updErr;

      setAvatarUrl(null);
      toast.success("Foto removida.");
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível remover a foto.");
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!user?.id || !newName.trim()) return;
    setSavingName(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { display_name: newName.trim() }
      });
      if (error) throw error;
      
      setIsEditingName(false);
      toast.success("Nome atualizado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar o nome.");
    } finally {
      setSavingName(false);
    }
  };

  return (
    <>
      <PricingModal open={pricingOpen} onOpenChange={setPricingOpen} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
      />
      <DropdownMenu>
        <DropdownMenuTrigger
          className="relative flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground border border-border overflow-hidden hover:ring-2 hover:ring-primary/40 transition-all"
          aria-label="Menu de perfil"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Foto de perfil"
              width={48}
              height={48}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <span>{initials}</span>
          )}
          {uploading && (
            <span className="absolute inset-0 flex items-center justify-center bg-background/70">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </span>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary border border-primary/20">
              {initials}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium truncate">{user?.user_metadata?.display_name || "Usuário"}</span>
              <span className="text-[10px] text-muted-foreground truncate">{user?.email}</span>
            </div>
          </div>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setProfileOpen(true)}>
            <UserIcon className="mr-2 h-4 w-4" />
            Meu Perfil
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handlePick} disabled={uploading}>
            <Camera className="mr-2 h-4 w-4" />
            {avatarUrl ? "Trocar foto" : "Adicionar foto"}
          </DropdownMenuItem>
          
          {avatarUrl && (
            <DropdownMenuItem
              onClick={handleRemove}
              disabled={uploading}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remover foto
            </DropdownMenuItem>
          )}

          {isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/admin")}>
                <Shield className="mr-2 h-4 w-4" />
                Painel admin
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md border-l border-border/50 bg-background p-0">
          <div className="flex flex-col h-full overflow-y-auto">
            <SheetHeader className="p-6 border-b border-border/50">
              <SheetTitle className="text-xl font-bold">Perfil do Usuário</SheetTitle>
              <SheetDescription>Gerencie suas informações e assinatura</SheetDescription>
            </SheetHeader>

            <div className="p-6 space-y-8">
              {/* Seção Minha Conta */}
              <section className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Minha Conta</h3>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border/50">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg border-2 border-primary/20">
                    {initials}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    {isEditingName ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="bg-background border border-border rounded px-2 py-1 text-sm w-full outline-none focus:ring-1 focus:ring-primary"
                          autoFocus
                          disabled={savingName}
                        />
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 shrink-0 text-primary hover:text-primary hover:bg-primary/10"
                          onClick={handleUpdateName}
                          disabled={savingName}
                        >
                          {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingName(true)}>
                        <span className="font-semibold truncate">{user?.user_metadata?.display_name || "Usuário"}</span>
                        <Edit2 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )}
                    <span className="text-sm text-muted-foreground truncate">{user?.email}</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => {
                  setProfileOpen(false);
                  signOut();
                }}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair da conta
                </Button>
              </section>

              {/* Seção Minha Assinatura */}
              <section className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Minha Assinatura</h3>
                
                <div className="p-5 rounded-2xl bg-muted/30 border border-border/50 space-y-4">
                  {accessStatus === "active" ? (
                    <div className="space-y-3">
                      <Badge className="bg-emerald-600 hover:bg-emerald-600 px-3 py-1 rounded-full border-none">
                        ✅ Assinatura Ativa
                      </Badge>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        Seu acesso está liberado. Obrigado por assinar!
                      </p>
                    </div>
                  ) : accessStatus === "trial" ? (
                    <div className="space-y-4">
                      <Badge className="bg-amber-600 hover:bg-amber-600 px-3 py-1 rounded-full border-none">
                        ⏳ Período de Teste
                      </Badge>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        Você tem <span className="font-bold text-foreground">{trialDaysRemaining} dias</span> restantes no seu período gratuito.
                      </p>
                      <div className="pt-2">
                        <Button 
                          onClick={() => setPricingOpen(true)}
                          className="w-full bg-primary hover:bg-primary/90 font-bold" 
                          size="sm"
                        >
                          Escolher plano
                          <ExternalLink className="ml-2 h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Badge variant="destructive" className="px-3 py-1 rounded-full border-none">
                        🔒 Acesso Suspenso
                      </Badge>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        Seu período de teste encerrou. Escolha um plano para continuar.
                      </p>
                      <div className="pt-2">
                        <Button 
                          onClick={() => setPricingOpen(true)}
                          className="w-full bg-primary hover:bg-primary/90 font-bold" 
                          size="sm"
                        >
                          Escolher plano
                          <ExternalLink className="ml-2 h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Suporte */}
              <div className="pt-10 border-t border-border/30">
                <a href="#" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <HelpCircle className="h-4 w-4" />
                  <span>Problema com sua assinatura? Entre em contato</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
