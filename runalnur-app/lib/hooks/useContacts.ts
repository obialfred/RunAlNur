import { useMemo } from "react";
import type { Contact } from "@/lib/types";
import { useApi } from "@/lib/hooks/useApi";

interface UseContactsOptions {
  armId?: string;
  search?: string;
}

export function useContacts(options: UseContactsOptions = {}) {
  const url = useMemo(() => {
    const params = new URLSearchParams();
    if (options.armId) params.set("arm_id", options.armId);
    if (options.search) params.set("search", options.search);
    const query = params.toString();
    return query ? `/api/contacts?${query}` : "/api/contacts";
  }, [options.armId, options.search]);

  // useApi normalizes responses - with `total` present, it returns full object
  const result = useApi<Contact[]>(url, []);
  
  // Ensure data is always an array (handles both normalized and raw responses)
  const rawData = result.data;
  const contacts: Contact[] = Array.isArray(rawData) 
    ? rawData 
    : (Array.isArray((rawData as { data?: Contact[] })?.data) 
        ? (rawData as { data: Contact[] }).data 
        : []);
  
  return {
    ...result,
    data: contacts,
    total: contacts.length,
  };
}
