import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Heart, Plus, Lock, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  symbol: string;
  name: string;
}

export function AddToWatchlistDialog({ open, onOpenChange, symbol, name }: Props) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    folders,
    foldersLoading,
    foldersForSymbol,
    addToWatchlist,
    removeFromWatchlist,
    canCreateFolder,
    isPremium,
    createFolder,
  } = useWatchlist();

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [busyFolderId, setBusyFolderId] = useState<string | null>(null);
  const [savingNew, setSavingNew] = useState(false);

  const memberOf = new Set(foldersForSymbol(symbol));

  const toggleFolder = async (folderId: string, currentlyIn: boolean) => {
    setBusyFolderId(folderId);
    const { error } = currentlyIn
      ? await removeFromWatchlist(symbol, folderId)
      : await addToWatchlist(symbol, name, folderId);
    setBusyFolderId(null);
    if (error) toast({ title: "Something went wrong", description: error.message, variant: "destructive" });
  };

  const submitNewFolder = async () => {
    if (!newName.trim()) return;
    setSavingNew(true);
    const { data, error } = await createFolder(newName.trim());
    if (error) {
      toast({ title: "Couldn't create watchlist", description: error.message, variant: "destructive" });
    } else if (data) {
      await addToWatchlist(symbol, name, data.id);
      setNewName("");
      setCreating(false);
      toast({ title: `Added to "${data.name}"` });
    }
    setSavingNew(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-4 h-4 fill-primary text-primary" />
            Add {symbol} to watchlist
          </DialogTitle>
        </DialogHeader>

        {foldersLoading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-1">
            {folders.map((folder) => {
              const currentlyIn = memberOf.has(folder.id);
              const busy = busyFolderId === folder.id;
              return (
                <button
                  key={folder.id}
                  onClick={() => toggleFolder(folder.id, currentlyIn)}
                  disabled={busy}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/60 transition-colors text-left disabled:opacity-60"
                >
                  <Checkbox checked={currentlyIn} className="pointer-events-none" />
                  <span className="flex-1 text-sm font-medium truncate">{folder.name}</span>
                  {busy && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
                </button>
              );
            })}

            {creating ? (
              <div className="flex items-center gap-2 px-3 py-2">
                <Input
                  autoFocus
                  placeholder="New watchlist name"
                  value={newName}
                  maxLength={40}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitNewFolder()}
                  className="h-9"
                />
                <Button size="sm" onClick={submitNewFolder} disabled={savingNew || !newName.trim()}>
                  {savingNew ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Add"}
                </Button>
              </div>
            ) : canCreateFolder ? (
              <button
                onClick={() => setCreating(true)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/60 transition-colors text-left text-primary"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">New watchlist</span>
              </button>
            ) : (
              <button
                onClick={() => navigate("/upgrade")}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors text-left"
              >
                <Lock className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Free plan: 1 watchlist</p>
                  <p className="text-xs text-muted-foreground">Upgrade to Premium for unlimited named watchlists</p>
                </div>
              </button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}