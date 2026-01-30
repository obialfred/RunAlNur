"use client";

import { useState } from "react";
import { useContacts } from "@/lib/hooks/useContacts";
import { ARMS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Globe, Instagram, Linkedin, Plus, Search } from "lucide-react";
import Link from "next/link";
import { FadeIn } from "@/components/motion/FadeIn";
import { EmptyState } from "@/components/rive/EmptyState";
import { ContactModal } from "@/components/modals/ContactModal";
import { DeleteConfirmDialog } from "@/components/modals/DeleteConfirmDialog";
import { Pagination } from "@/components/ui/pagination";
import { motion } from "framer-motion";
import { duration, easing } from "@/lib/motion/tokens";
import { HubSpotSync } from "@/components/contacts/HubSpotSync";

function normalizeUrlMaybe(value?: string | null) {
  if (!value) return null;
  const v = value.trim();
  if (!v) return null;
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
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

export default function ContactsPage() {
  const { data: contacts, refresh } = useContacts();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<typeof contacts[number] | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterArm, setFilterArm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const listVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.04, delayChildren: 0.02 } },
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 6 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: duration.fast, ease: easing.standard },
    },
  };

  const handleCreate = () => {
    // Close any open delete dialog first
    setDeleteDialogOpen(false);
    setDeletingId(null);
    setEditingContact(null);
    setModalOpen(true);
  };

  const handleEdit = (contact: typeof contacts[number]) => {
    // Close any open delete dialog first
    setDeleteDialogOpen(false);
    setDeletingId(null);
    setEditingContact(contact);
    setModalOpen(true);
  };

  const handleDeleteClick = (contactId: string) => {
    // Close any open edit modal first
    setModalOpen(false);
    setEditingContact(null);
    setDeletingId(contactId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setDeleteLoading(true);
    await fetch(`/api/contacts/${deletingId}`, { method: "DELETE" });
    await refresh();
    setDeleteLoading(false);
    setDeleteDialogOpen(false);
    setDeletingId(null);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <FadeIn className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Contacts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {contacts.length} contacts across all arms
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <HubSpotSync onSynced={refresh} />
          <Button size="sm" className="gap-1.5 text-xs flex-1 sm:flex-none" onClick={handleCreate}>
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">NEW CONTACT</span>
            <span className="sm:hidden">NEW</span>
          </Button>
        </div>
      </FadeIn>

      {/* Search & Filters */}
      <FadeIn className="space-y-3">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="pl-9 h-11 sm:h-9 text-sm bg-muted border-0"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          <select
            value={filterArm}
            onChange={(e) => { setFilterArm(e.target.value); setCurrentPage(1); }}
            className="h-11 sm:h-9 text-xs bg-muted border-0 rounded-sm px-3 min-w-[100px] flex-shrink-0"
          >
            <option value="">All Arms</option>
            {ARMS.map((arm) => (
              <option key={arm.id} value={arm.id}>{arm.name}</option>
            ))}
          </select>
        </div>
      </FadeIn>

      {/* Contacts Table */}
      <FadeIn>
        {(() => {
          // Filter contacts
          const filteredContacts = contacts.filter((contact) => {
            if (searchQuery) {
              const query = searchQuery.toLowerCase();
              const matchesName = contact.name.toLowerCase().includes(query);
              const matchesEmail = contact.email?.toLowerCase().includes(query);
              const matchesCompany = contact.company?.toLowerCase().includes(query);
              const matchesRole = contact.role?.toLowerCase().includes(query);
              if (!matchesName && !matchesEmail && !matchesCompany && !matchesRole) return false;
            }
            if (filterArm && contact.arm_id !== filterArm) return false;
            return true;
          });

          // Pagination
          const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);
          const paginatedContacts = filteredContacts.slice(
            (currentPage - 1) * itemsPerPage,
            currentPage * itemsPerPage
          );

          if (filteredContacts.length === 0 && contacts.length === 0) {
            return (
              <div className="agentic-card">
                <EmptyState
                  title="No contacts yet"
                  description="Add architects, contractors, and partners."
                  riveSrc="/rive/empty-contacts.riv"
                />
              </div>
            );
          }

          if (filteredContacts.length === 0) {
            return (
              <div className="agentic-card p-12 text-center">
                <p className="text-sm text-muted-foreground">No contacts match your filters</p>
              </div>
            );
          }

          return (
          <div className="agentic-card overflow-hidden">
            <div className="table-responsive">
              <table className="agentic-table min-w-[980px]">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th className="hidden sm:table-cell">Arm</th>
                    <th>Role</th>
                    <th className="hidden md:table-cell">Company</th>
                    <th className="hidden lg:table-cell">Phone</th>
                    <th className="hidden xl:table-cell">Email</th>
                    <th className="hidden xl:table-cell">Socials</th>
                    <th className="hidden 2xl:table-cell">Tags</th>
                    <th></th>
                  </tr>
                </thead>
                <motion.tbody initial="hidden" animate="visible" variants={listVariants}>
                  {paginatedContacts.map((contact) => {
                    const arm = ARMS.find(a => a.id === contact.arm_id);
                    const ig = instagramUrl(contact.socials?.instagram);
                    const li = normalizeUrlMaybe(contact.socials?.linkedin);
                    const web = normalizeUrlMaybe(contact.socials?.website);
                    const hasSocials = Boolean(ig || li || web);

                    return (
                      <motion.tr key={contact.id} variants={rowVariants}>
                        <td>
                          <span className="font-medium">{contact.name}</span>
                          {/* Show arm and company on mobile inline */}
                          <div className="sm:hidden mt-0.5">
                            <span className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground">
                              {arm?.name}
                            </span>
                            {contact.company && (
                              <span className="text-xs text-muted-foreground ml-2">
                                • {contact.company}
                              </span>
                            )}
                            {contact.phone && (
                              <span className="text-xs text-muted-foreground ml-2">
                                • {contact.phone}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="hidden sm:table-cell">
                          <Link 
                            href={`/arms/${arm?.slug}`}
                            className="text-xs font-medium tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {arm?.name}
                          </Link>
                        </td>
                        <td className="text-muted-foreground">{contact.role || '—'}</td>
                        <td className="hidden md:table-cell text-muted-foreground">{contact.company || '—'}</td>
                        <td className="hidden lg:table-cell">
                          <span className="text-sm font-mono text-muted-foreground">
                            {contact.phone || '—'}
                          </span>
                        </td>
                        <td className="hidden xl:table-cell">
                          <span className="text-sm font-mono text-muted-foreground">
                            {contact.email || '—'}
                          </span>
                        </td>
                        <td className="hidden xl:table-cell">
                          {hasSocials ? (
                            <div className="flex items-center gap-2">
                              {ig ? (
                                <a
                                  href={ig}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-sm border hover:bg-muted transition-colors"
                                  aria-label="Instagram"
                                  title="Instagram"
                                >
                                  <Instagram className="w-4 h-4 text-muted-foreground" />
                                </a>
                              ) : null}
                              {li ? (
                                <a
                                  href={li}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-sm border hover:bg-muted transition-colors"
                                  aria-label="LinkedIn"
                                  title="LinkedIn"
                                >
                                  <Linkedin className="w-4 h-4 text-muted-foreground" />
                                </a>
                              ) : null}
                              {web ? (
                                <a
                                  href={web}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-sm border hover:bg-muted transition-colors"
                                  aria-label="Website"
                                  title="Website"
                                >
                                  <Globe className="w-4 h-4 text-muted-foreground" />
                                </a>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="hidden 2xl:table-cell">
                          <div className="flex gap-1">
                            {contact.tags?.slice(0, 3).map(tag => (
                              <span key={tag} className="variant-badge draft">
                                {tag}
                              </span>
                            ))}
                            {contact.tags && contact.tags.length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                +{contact.tags.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-[10px] h-9 sm:h-7 px-3 sm:px-2 active:scale-95"
                              onClick={() => handleEdit(contact)}
                            >
                              EDIT
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-[10px] h-9 sm:h-7 px-3 sm:px-2 text-[var(--error)] active:scale-95"
                              onClick={() => handleDeleteClick(contact.id)}
                            >
                              DELETE
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </motion.tbody>
              </table>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredContacts.length}
              itemsPerPage={itemsPerPage}
              className="px-4 pb-4"
            />
          </div>
          );
        })()}
      </FadeIn>

      <ContactModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        contact={editingContact || undefined}
        onSaved={refresh}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Contact"
        description="Are you sure you want to delete this contact? This action cannot be undone."
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
      />
    </div>
  );
}
