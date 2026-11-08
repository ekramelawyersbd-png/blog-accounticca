import { REGULATORY_DOCUMENTS, RegulatoryDocument } from '../data/regulatoryLibraryData';
import { RESOURCE_TEMPLATES, ResourceTemplate } from '../data/resourceTemplates';

const DOCS_STORAGE_KEY = 'e_lawyers_regulatory_docs_v1';
const TEMPLATES_STORAGE_KEY = 'e_lawyers_resource_templates_v1';

// Helper to get stored docs or fallback to initial defaults
export async function getRegulatoryDocuments(): Promise<RegulatoryDocument[]> {
  try {
    const raw = localStorage.getItem(DOCS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(DOCS_STORAGE_KEY, JSON.stringify(REGULATORY_DOCUMENTS));
      return REGULATORY_DOCUMENTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : REGULATORY_DOCUMENTS;
  } catch (err) {
    console.error('Failed to load regulatory documents:', err);
    return REGULATORY_DOCUMENTS;
  }
}

// Save or Update a Regulatory Document
export async function saveRegulatoryDocument(
  docInput: Partial<RegulatoryDocument> & { authority: RegulatoryDocument['authority']; docNo: string; docDate: string; description: string }
): Promise<RegulatoryDocument> {
  const currentDocs = await getRegulatoryDocuments();

  const id = docInput.id || `reg-${Date.now()}`;
  const year = docInput.year || new Date(docInput.docDate).getFullYear() || 2026;

  // Infer authorityCode
  let authorityCode: RegulatoryDocument['authorityCode'] = 'others';
  if (docInput.authority.includes('Bangladesh Bank')) authorityCode = 'bb';
  else if (docInput.authority.includes('National Board of Revenue') || docInput.authority.includes('NBR')) authorityCode = 'nbr';
  else if (docInput.authority.includes('BIDA')) authorityCode = 'bida';
  else if (docInput.authority.includes('RJSC')) authorityCode = 'rjsc';
  else if (docInput.authority.includes('BSEC')) authorityCode = 'bsec';
  else if (docInput.authority.includes('Ministry of Law')) authorityCode = 'law';

  const newDoc: RegulatoryDocument = {
    id,
    authority: docInput.authority,
    authorityCode,
    docNo: docInput.docNo.trim(),
    docDate: docInput.docDate,
    year,
    description: docInput.description.trim(),
    category: docInput.category || 'Circular',
    pdfUrl: docInput.pdfUrl?.trim() || undefined,
    details: docInput.details?.trim() || undefined,
  };

  const existingIndex = currentDocs.findIndex((d) => d.id === id);
  let updatedList: RegulatoryDocument[];

  if (existingIndex >= 0) {
    updatedList = [...currentDocs];
    updatedList[existingIndex] = newDoc;
  } else {
    updatedList = [newDoc, ...currentDocs];
  }

  localStorage.setItem(DOCS_STORAGE_KEY, JSON.stringify(updatedList));
  return newDoc;
}

// Delete a Regulatory Document
export async function deleteRegulatoryDocument(id: string): Promise<void> {
  const currentDocs = await getRegulatoryDocuments();
  const filtered = currentDocs.filter((d) => d.id !== id);
  localStorage.setItem(DOCS_STORAGE_KEY, JSON.stringify(filtered));
}

// Helper to get stored legal templates
export async function getResourceTemplates(): Promise<ResourceTemplate[]> {
  try {
    const raw = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(RESOURCE_TEMPLATES));
      return RESOURCE_TEMPLATES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : RESOURCE_TEMPLATES;
  } catch (err) {
    console.error('Failed to load resource templates:', err);
    return RESOURCE_TEMPLATES;
  }
}

// Save or Update a Legal Template
export async function saveResourceTemplate(
  templateInput: Partial<ResourceTemplate> & { title: string; subtitle: string; category: ResourceTemplate['category']; description: string; fullText: string }
): Promise<ResourceTemplate> {
  const currentTemplates = await getResourceTemplates();

  const id = templateInput.id || `tpl-${Date.now()}`;
  const newTemplate: ResourceTemplate = {
    id,
    title: templateInput.title.trim(),
    subtitle: templateInput.subtitle.trim(),
    category: templateInput.category,
    description: templateInput.description.trim(),
    fileSizeEstimate: templateInput.fileSizeEstimate?.trim() || '2 Pages • PDF',
    pages: templateInput.pages || 2,
    badge: templateInput.badge?.trim() || undefined,
    tags: templateInput.tags && templateInput.tags.length > 0 ? templateInput.tags : ['Regulatory', 'Compliance'],
    governingLaw: templateInput.governingLaw?.trim() || 'Contract Act, 1872 (Bangladesh)',
    sections: templateInput.sections || [
      {
        heading: '1. Standard Compliance Terms',
        content: templateInput.description,
      },
    ],
    fullText: templateInput.fullText.trim(),
  };

  const existingIndex = currentTemplates.findIndex((t) => t.id === id);
  let updatedList: ResourceTemplate[];

  if (existingIndex >= 0) {
    updatedList = [...currentTemplates];
    updatedList[existingIndex] = newTemplate;
  } else {
    updatedList = [newTemplate, ...currentTemplates];
  }

  localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(updatedList));
  return newTemplate;
}

// Delete a Legal Template
export async function deleteResourceTemplate(id: string): Promise<void> {
  const currentTemplates = await getResourceTemplates();
  const filtered = currentTemplates.filter((t) => t.id !== id);
  localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(filtered));
}

// Reset data back to original statutory defaults
export async function resetRegulatoryLibraryDefaults(): Promise<{ docs: RegulatoryDocument[]; templates: ResourceTemplate[] }> {
  localStorage.setItem(DOCS_STORAGE_KEY, JSON.stringify(REGULATORY_DOCUMENTS));
  localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(RESOURCE_TEMPLATES));
  return { docs: REGULATORY_DOCUMENTS, templates: RESOURCE_TEMPLATES };
}
