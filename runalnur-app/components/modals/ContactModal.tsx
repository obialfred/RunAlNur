"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ARMS } from "@/lib/constants";
import type { Contact } from "@/lib/types";

interface ContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact | null;
  defaultArmId?: string;
  onSaved?: () => void;
}

export function ContactModal({ open, onOpenChange, contact, defaultArmId, onSaved }: ContactModalProps) {
  const [name, setName] = useState(contact?.name || "");
  const [email, setEmail] = useState(contact?.email || "");
  const [phone, setPhone] = useState(contact?.phone || "");
  const [instagram, setInstagram] = useState(contact?.socials?.instagram || "");
  const [linkedin, setLinkedin] = useState(contact?.socials?.linkedin || "");
  const [website, setWebsite] = useState(contact?.socials?.website || "");
  const [company, setCompany] = useState(contact?.company || "");
  const [role, setRole] = useState(contact?.role || "");
  const [armId, setArmId] = useState<string>(contact?.arm_id || defaultArmId || ARMS[0].id);
  const [tags, setTags] = useState(contact?.tags?.join(", ") || "");
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isEdit = Boolean(contact?.id);

  useEffect(() => {
    setName(contact?.name || "");
    setEmail(contact?.email || "");
    setPhone(contact?.phone || "");
    setInstagram(contact?.socials?.instagram || "");
    setLinkedin(contact?.socials?.linkedin || "");
    setWebsite(contact?.socials?.website || "");
    setCompany(contact?.company || "");
    setRole(contact?.role || "");
    setArmId(contact?.arm_id || defaultArmId || ARMS[0].id);
    setTags(contact?.tags?.join(", ") || "");
    setSubmitError(null);
  }, [contact, defaultArmId, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get current form values directly from the form elements as a fallback
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const formName = formData.get("name") as string || "";
    
    // Use state value if available, fallback to form data
    const finalName = name.trim() || formName.trim();
    
    // Client-side validation
    if (!finalName) {
      setSubmitError("Please enter a contact name");
      return;
    }
    
    setLoading(true);
    setSubmitError(null);

    const payload = {
      name: finalName,
      email: email || null,
      phone: phone || null,
      socials: {
        instagram: instagram || null,
        linkedin: linkedin || null,
        website: website || null,
      },
      company: company || null,
      role: role || null,
      arm_id: armId,
      tags: tags ? tags.split(",").map(tag => tag.trim()).filter(Boolean) : [],
    };

    const url = isEdit ? `/api/contacts/${contact?.id}` : "/api/contacts";
    const method = isEdit ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get("content-type") || "";
      const json = contentType.includes("application/json") ? await res.json().catch(() => null) : null;

      if (!res.ok || !json?.success) {
        const debugText = json?.debug ? `\n\nDEBUG:\n${JSON.stringify(json.debug, null, 2)}` : "";
        setSubmitError((json?.error || `Save failed (${res.status})`) + debugText);
        return;
      }

      onOpenChange(false);
      onSaved?.();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-section">
            {isEdit ? "Edit Contact" : "New Contact"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
              Name
            </label>
            <Input 
              name="name"
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              autoComplete="off"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
                Email
              </label>
              <Input 
                name="email"
                value={email || ""} 
                onChange={(e) => setEmail(e.target.value)} 
                autoComplete="off"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
                Phone
              </label>
              <Input 
                name="phone"
                value={phone || ""} 
                onChange={(e) => setPhone(e.target.value)} 
                autoComplete="off"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
                Instagram
              </label>
              <Input
                name="instagram"
                value={instagram || ""}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@handle or url"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
                LinkedIn
              </label>
              <Input
                name="linkedin"
                value={linkedin || ""}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="profile url"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
                Website
              </label>
              <Input
                name="website"
                value={website || ""}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://…"
                autoComplete="off"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
                Company
              </label>
              <Input 
                name="company"
                value={company || ""} 
                onChange={(e) => setCompany(e.target.value)} 
                autoComplete="off"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
                Role
              </label>
              <Input 
                name="role"
                value={role || ""} 
                onChange={(e) => setRole(e.target.value)} 
                autoComplete="off"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
              Arm
            </label>
            <select
              value={armId}
              onChange={(e) => setArmId(e.target.value)}
              className="w-full h-9 text-sm bg-muted border border-border rounded-sm px-3"
            >
              {ARMS.map((arm) => (
                <option key={arm.id} value={arm.id}>
                  {arm.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
              Tags (comma-separated)
            </label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
          {submitError && (
            <div
              role="alert"
              aria-live="polite"
              aria-label={submitError}
              className="text-xs text-[var(--error)] whitespace-pre-wrap"
            >
              {submitError}
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
