import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { globalSearch } from "@/services/search";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const navigate = useNavigate();

  const { data: groups = [] } = useQuery({
    queryKey: ["search", term],
    queryFn: () => globalSearch(term),
    enabled: term.trim().length > 0,
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-full max-w-sm items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-muted/60"
      >
        <Search className="size-4" />
        <span className="truncate">Search customers, products, invoices…</span>
        <kbd className="ml-auto hidden rounded border border-border px-1.5 py-0.5 text-[10px] sm:inline">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          value={term}
          onValueChange={setTerm}
          placeholder="Search across your workspace…"
        />
        <CommandList>
          <CommandEmpty>
            {term ? "No matches found." : "Start typing to search your workspace."}
          </CommandEmpty>
          {groups.map((group) => (
            <CommandGroup key={group.group} heading={group.group}>
              {group.hits.map((hit) => (
                <CommandItem
                  key={hit.id}
                  value={`${group.group}-${hit.label}-${hit.meta}`}
                  onSelect={() => {
                    setOpen(false);
                    setTerm("");
                    void navigate({ to: hit.to, params: hit.params } as never);
                  }}
                >
                  <span className="font-medium">{hit.label}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{hit.meta}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
