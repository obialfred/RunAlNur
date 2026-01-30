"use client";

import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { spring } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";
import { useContacts } from "@/lib/hooks/useContacts";
import { ARMS } from "@/lib/constants";
import type { Contact as CRMContact } from "@/lib/types";
import { InteractionLogger } from "@/components/influence/InteractionLogger";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  return parts
    .slice(0, 2)
    .map((p) => p[0] || "")
    .join("")
    .toUpperCase();
}

function normalizePhoneForWhatsApp(phone?: string) {
  if (!phone) return null;
  const digits = phone.replace(/[^\d+]/g, "");
  // WhatsApp expects country code. If caller stored local numbers, we still provide a best-effort link.
  const cleaned = digits.startsWith("+") ? digits.slice(1) : digits;
  const justDigits = cleaned.replace(/[^\d]/g, "");
  return justDigits.length >= 8 ? justDigits : null;
}

function normalizeUrlMaybe(value?: string | null) {
  if (!value) return null;
  const v = value.trim();
  if (!v) return null;
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  // Allow user to paste domains without scheme
  return `https://${v}`;
}

function instagramUrl(value?: string | null) {
  if (!value) return null;
  const v = value.trim();
  if (!v) return null;
  if (v.includes("instagram.com")) return normalizeUrlMaybe(v);
  const handle = v.startsWith("@") ? v.slice(1) : v;
  return handle ? `https://instagram.com/${encodeURIComponent(handle)}` : null;
}

function getTagValue(tags: string[] | undefined, prefix: string) {
  const found = (tags || []).find((t) => t.toLowerCase().startsWith(prefix.toLowerCase()));
  return found ? found.slice(prefix.length) : null;
}

export default function RelationshipsPage() {
  const shouldReduce = useReducedMotion();
  const { data: contacts } = useContacts();
  const [searchQuery, setSearchQuery] = useState("");
  const [focusedArmId, setFocusedArmId] = useState<string | null>(null);
  const [collapsedArmIds, setCollapsedArmIds] = useState<Set<string>>(() => new Set());
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<CRMContact | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!detailOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDetailOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [detailOpen]);

  const filteredContacts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) => {
      return (
        c.name.toLowerCase().includes(q) ||
        (c.company || "").toLowerCase().includes(q) ||
        (c.role || "").toLowerCase().includes(q) ||
        (c.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [contacts, searchQuery]);

  const groupedByArm = useMemo(() => {
    const map = new Map<string, CRMContact[]>();
    for (const c of filteredContacts) {
      const key = c.arm_id || "unknown";
      const arr = map.get(key) || [];
      arr.push(c);
      map.set(key, arr);
    }
    return map;
  }, [filteredContacts]);

  const armCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const arm of ARMS) {
      counts.set(arm.id, (groupedByArm.get(arm.id) || []).length);
    }
    return counts;
  }, [groupedByArm]);

  const visibleArms = useMemo(() => {
    if (focusedArmId) {
      return ARMS.filter((a) => a.id === focusedArmId);
    }
    return ARMS.filter((a) => (armCounts.get(a.id) || 0) > 0);
  }, [armCounts, focusedArmId]);

  const openContact = (c: CRMContact) => {
    setSelectedContact(c);
    setDetailOpen(true);
  };

  const toggleCollapsed = (armId: string) => {
    setCollapsedArmIds((prev) => {
      const next = new Set(prev);
      if (next.has(armId)) next.delete(armId);
      else next.add(armId);
      return next;
    });
  };

  const expandAll = () => setCollapsedArmIds(new Set());
  const collapseAll = () => setCollapsedArmIds(new Set(visibleArms.map((a) => a.id)));

  return (
    <LayoutGroup id="influence-contacts">
      <motion.div
        className="space-y-6"
        initial={shouldReduce ? {} : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Relationships
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Contacts grouped by arm (Janna, Nova, etc.)
          </p>
        </div>
        <Button size="sm" className="gap-2" asChild>
          <a href="/contacts">
            <Plus className="w-4 h-4" />
            Add Contact
          </a>
        </Button>
      </div>

      {/* Arm Focus + Controls */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFocusedArmId(null)}
            className={cn(
              "px-3 py-1.5 rounded-sm border text-xs font-semibold tracking-widest uppercase transition-colors",
              focusedArmId === null
                ? "bg-foreground text-background border-foreground"
                : "hover:bg-muted"
            )}
          >
            All Arms
          </button>
          {ARMS.map((arm) => {
            const count = armCounts.get(arm.id) || 0;
            const active = focusedArmId === arm.id;
            return (
              <button
                key={arm.id}
                onClick={() => setFocusedArmId(arm.id)}
                className={cn(
                  "px-3 py-1.5 rounded-sm border text-xs font-semibold tracking-widest uppercase transition-colors flex items-center gap-2",
                  active
                    ? "bg-foreground text-background border-foreground"
                    : "hover:bg-muted"
                )}
              >
                <span className={cn("inline-block w-2 h-2 rounded-full", arm.colorClass)} />
                {arm.name}
                <span
                  className={cn(
                    "text-[10px] font-mono",
                    active ? "text-background/80" : "text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            Expand
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            Collapse
          </Button>
          {focusedArmId ? (
            <Button variant="ghost" size="sm" onClick={() => setFocusedArmId(null)}>
              Clear focus
            </Button>
          ) : null}
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts (name/company/role/tags)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Contacts by Arm */}
      {filteredContacts.length === 0 ? (
        <motion.div
          className="agentic-card"
          initial={shouldReduce ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, ...spring.default }}
        >
          <div className="agentic-card-content text-center py-12">
            <User className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground">No contacts yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add contacts to start tracking relationships (or adjust your search).
            </p>
            <Button size="sm" className="mt-4 gap-2" asChild>
              <a href="/contacts">
                <Plus className="w-4 h-4" />
                Add Contact
              </a>
            </Button>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {visibleArms.map((arm) => {
            const armContacts = groupedByArm.get(arm.id) || [];
            if (armContacts.length === 0) return null;
            const collapsed = collapsedArmIds.has(arm.id);
            return (
              <ContactSection
                key={arm.id}
                contacts={armContacts}
                armName={arm.name}
                armDescription={arm.description}
                armColorClass={arm.colorClass}
                collapsed={collapsed}
                onToggleCollapsed={() => toggleCollapsed(arm.id)}
                onFocus={() => setFocusedArmId(arm.id)}
                onOpenContact={openContact}
              />
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {detailOpen && selectedContact ? (
          <motion.div
            key="contact-overlay"
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDetailOpen(false)}
          >
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            <motion.div
              layoutId={`contact-card-${selectedContact.id}`}
              transition={
                shouldReduce
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 700, damping: 55, mass: 0.6 }
              }
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "fixed z-50 bg-background border shadow-2xl overflow-hidden",
                isMobile
                  ? "left-2 right-2 bottom-2 rounded-lg safe-bottom"
                  : "left-1/2 top-1/2 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-lg"
              )}
            >
              <div className="p-4 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-semibold shrink-0">
                        {getInitials(selectedContact.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-lg font-semibold truncate">{selectedContact.name}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {selectedContact.role || "—"}
                          {selectedContact.company ? ` · ${selectedContact.company}` : ""}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button variant="outline" size="sm" onClick={() => setDetailOpen(false)}>
                    Close
                  </Button>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedContact.email ? (
                    <a
                      className="inline-flex items-center justify-between gap-3 rounded-sm border px-3 py-2 hover:bg-muted transition-colors"
                      href={`mailto:${selectedContact.email}`}
                    >
                      <span className="inline-flex items-center gap-2 min-w-0">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="truncate">{selectedContact.email}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">Email</span>
                    </a>
                  ) : null}

                  {selectedContact.phone ? (
                    <a
                      className="inline-flex items-center justify-between gap-3 rounded-sm border px-3 py-2 hover:bg-muted transition-colors"
                      href={`tel:${selectedContact.phone}`}
                    >
                      <span className="inline-flex items-center gap-2 min-w-0">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="truncate">{selectedContact.phone}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">Call</span>
                    </a>
                  ) : null}

                  {normalizePhoneForWhatsApp(selectedContact.phone) ? (
                    <a
                      className="inline-flex items-center justify-between gap-3 rounded-sm border px-3 py-2 hover:bg-muted transition-colors"
                      href={`https://wa.me/${normalizePhoneForWhatsApp(selectedContact.phone)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span className="inline-flex items-center gap-2 min-w-0">
                        <MessageCircle className="w-4 h-4 text-muted-foreground" />
                        <span className="truncate">WhatsApp</span>
                      </span>
                      <span className="text-xs text-muted-foreground">Message</span>
                    </a>
                  ) : null}

                  {instagramUrl(selectedContact.socials?.instagram) ? (
                    <a
                      className="inline-flex items-center justify-between gap-3 rounded-sm border px-3 py-2 hover:bg-muted transition-colors"
                      href={instagramUrl(selectedContact.socials?.instagram) as string}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span className="inline-flex items-center gap-2 min-w-0">
                        <Instagram className="w-4 h-4 text-muted-foreground" />
                        <span className="truncate">Instagram</span>
                      </span>
                      <span className="text-xs text-muted-foreground">Social</span>
                    </a>
                  ) : null}

                  {normalizeUrlMaybe(selectedContact.socials?.linkedin) ? (
                    <a
                      className="inline-flex items-center justify-between gap-3 rounded-sm border px-3 py-2 hover:bg-muted transition-colors"
                      href={normalizeUrlMaybe(selectedContact.socials?.linkedin) as string}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span className="inline-flex items-center gap-2 min-w-0">
                        <Linkedin className="w-4 h-4 text-muted-foreground" />
                        <span className="truncate">LinkedIn</span>
                      </span>
                      <span className="text-xs text-muted-foreground">Profile</span>
                    </a>
                  ) : null}

                  {normalizeUrlMaybe(selectedContact.socials?.website) ? (
                    <a
                      className="inline-flex items-center justify-between gap-3 rounded-sm border px-3 py-2 hover:bg-muted transition-colors"
                      href={normalizeUrlMaybe(selectedContact.socials?.website) as string}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span className="inline-flex items-center gap-2 min-w-0">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <span className="truncate">Website</span>
                      </span>
                      <span className="text-xs text-muted-foreground">Open</span>
                    </a>
                  ) : null}

                  <Button
                    variant="outline"
                    className="justify-between"
                    onClick={() => setLogOpen(true)}
                  >
                    Log interaction
                    <span className="text-xs text-muted-foreground">Follow-up</span>
                  </Button>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Arm</div>
                    <div className="text-sm font-medium">
                      {ARMS.find((a) => a.id === selectedContact.arm_id)?.name || selectedContact.arm_id || "—"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Reachout</div>
                    <div className="text-sm font-medium">
                      {(getTagValue(selectedContact.tags, "reachout:") || "unknown").toUpperCase()}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Tags</div>
                    {selectedContact.tags && selectedContact.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {selectedContact.tags.slice(0, 6).map((t) => (
                          <span key={t} className="variant-badge draft">
                            {t}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">—</div>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="text-xs text-muted-foreground">Notes</div>
                  <div className="text-sm whitespace-pre-wrap break-words">
                    {selectedContact.notes || "—"}
                  </div>
                </div>

                <div className="mt-4">
                  <Button asChild variant="outline" className="w-full">
                    <a href={`/contacts?search=${encodeURIComponent(selectedContact.name)}`}>
                      Open in Contacts (CRM)
                    </a>
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {selectedContact ? (
        <InteractionLogger
          open={logOpen}
          onOpenChange={setLogOpen}
          contact={{ id: selectedContact.id, name: selectedContact.name, company: selectedContact.company || undefined }}
        />
      ) : null}
      </motion.div>
    </LayoutGroup>
  );
}

function ContactSection({
  contacts,
  armName,
  armDescription,
  armColorClass,
  collapsed,
  onToggleCollapsed,
  onFocus,
  onOpenContact,
}: {
  contacts: CRMContact[];
  armName: string;
  armDescription?: string;
  armColorClass: string;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onFocus: () => void;
  onOpenContact: (c: CRMContact) => void;
}) {
  const shouldReduce = useReducedMotion();

  if (collapsed) {
    return (
      <button
        onClick={onToggleCollapsed}
        className="w-full flex items-center justify-between rounded-sm border bg-card px-4 py-3 hover:bg-muted transition-colors"
      >
        <span className="inline-flex items-center gap-3">
          <span className={cn("inline-block w-2 h-2 rounded-full", armColorClass)} />
          <span className="text-section">{armName}</span>
          <span className="text-xs text-muted-foreground">({contacts.length})</span>
          {armDescription ? (
            <span className="text-xs text-muted-foreground hidden sm:inline">· {armDescription}</span>
          ) : null}
        </span>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </button>
    );
  }

  return (
    <motion.div
      className="agentic-card"
      initial={shouldReduce ? {} : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring.default}
    >
      <div className="agentic-card-header flex items-center justify-between gap-3">
        <button onClick={onToggleCollapsed} className="flex items-center gap-2">
          <span className={cn("inline-block w-2 h-2 rounded-full", armColorClass)} />
          <h2 className="text-section">{armName}</h2>
          <span className="text-xs text-muted-foreground">({contacts.length})</span>
          {armDescription ? (
            <span className="text-xs text-muted-foreground hidden sm:inline">· {armDescription}</span>
          ) : null}
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>
        <Button variant="outline" size="sm" onClick={onFocus}>
          Focus
        </Button>
      </div>

      <AnimatePresence initial={false}>
        <motion.div
          key="table"
          className="table-responsive"
          initial={shouldReduce ? {} : { height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={shouldReduce ? {} : { height: 0, opacity: 0 }}
          transition={shouldReduce ? { duration: 0 } : { duration: 0.25 }}
        >
          <div className="min-w-[900px]">
            <div className="grid grid-cols-[minmax(260px,2fr)_minmax(140px,1fr)_minmax(160px,1fr)_minmax(220px,2fr)_56px] border-b border-border px-4 py-3 text-[11px] font-medium tracking-[0.05em] uppercase text-muted-foreground">
              <div>Contact</div>
              <div>Role</div>
              <div>Company</div>
              <div>Tags</div>
              <div />
            </div>
            <div className="divide-y divide-border">
              {contacts.map((contact) => (
                <ContactRow
                  key={contact.id}
                  contact={contact}
                  onOpen={() => onOpenContact(contact)}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

function ContactRow({ contact, onOpen }: { contact: CRMContact; onOpen: () => void }) {
  return (
    <motion.div
      layoutId={`contact-card-${contact.id}`}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpen();
      }}
      className="group w-full grid grid-cols-[minmax(260px,2fr)_minmax(140px,1fr)_minmax(160px,1fr)_minmax(220px,2fr)_56px] px-4 py-3 hover:bg-muted transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">
          {getInitials(contact.name)}
        </div>
        <div className="min-w-0">
          <div className="font-medium truncate">{contact.name}</div>
          <div className="text-xs text-muted-foreground flex flex-col">
            {contact.email ? <span className="truncate">{contact.email}</span> : null}
            {contact.phone ? <span className="truncate">{contact.phone}</span> : null}
          </div>
        </div>
      </div>
      <div className="text-sm text-muted-foreground truncate">{contact.role || "—"}</div>
      <div className="text-sm text-muted-foreground truncate">{contact.company || "—"}</div>
      <div className="min-w-0">
        {contact.tags && contact.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {contact.tags.slice(0, 4).map((t) => (
              <span key={t} className="variant-badge draft">
                {t}
              </span>
            ))}
            {contact.tags.length > 4 ? (
              <span className="text-xs text-muted-foreground">+{contact.tags.length - 4}</span>
            ) : null}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </div>
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onOpen();
          }}
        >
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}
