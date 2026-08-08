import { request, requestNoContent, isDemoMode, BASE_URL, tokenStore, registerDemoHandler } from './httpClient';
import type { Attachment } from './httpClient';

export const demoAttachmentsDb: Attachment[] = [
  {
    id: 'demo-attach-1',
    entity_type: 'employee',
    entity_id: '1d63b635-8933-45d1-a233-d6902e3b27f1',
    file_name: 'Employment_Contract_Rashidov.pdf',
    file_path: 'employee/1d63b635-8933-45d1-a233-d6902e3b27f1/contract.pdf',
    mime_type: 'application/pdf'
  },
  {
    id: 'demo-attach-2',
    entity_type: 'employee',
    entity_id: '1d63b635-8933-45d1-a233-d6902e3b27f1',
    file_name: 'Passport_Scan.jpg',
    file_path: 'employee/1d63b635-8933-45d1-a233-d6902e3b27f1/passport.jpg',
    mime_type: 'image/jpeg'
  },
  {
    id: 'demo-attach-3',
    entity_type: 'client',
    entity_id: 'c-client-1',
    file_name: 'Jasur_Yoldoshev_Passport.pdf',
    file_path: 'client/c-client-1/passport.pdf',
    mime_type: 'application/pdf'
  },
  {
    id: 'demo-attach-4',
    entity_type: 'client',
    entity_id: 'c-client-1',
    file_name: 'Global_Cargo_Logistics_Contract_2026.pdf',
    file_path: 'client/c-client-1/contract.pdf',
    mime_type: 'application/pdf'
  }
];

export function getDemoAttachments(entityType: 'employee' | 'client', entityId: string): Attachment[] {
  return demoAttachmentsDb.filter(att => att.entity_type === entityType && att.entity_id === entityId);
}

// Register demo handler for attachments
registerDemoHandler((path: string, options: RequestInit) => {
  if (
    path.startsWith('/attachments/entity/employee/') ||
    path.startsWith('/attachments/entity/client/') ||
    path.startsWith('/attachments/entity/employees/') ||
    path.startsWith('/attachments/entity/clients/')
  ) {
    const parts = path.split('/');
    const rawType = parts[3];
    // Map plural backend types back to singular for local demo DB
    const entityType = (rawType === 'employees' || rawType === 'employee') ? 'employee' : 'client';
    const entityId = parts[4] || '';
    return {
      handled: true,
      result: demoAttachmentsDb.filter(
        (att) => att.entity_id === entityId && (att.entity_type === entityType || (entityType === 'employee' ? att.entity_type === 'employees' : att.entity_type === 'clients'))
      )
    };
  }

  if (path === '/attachments/upload' && options.method === 'POST') {
    let fileName = 'uploaded_file.bin';
    let fileType = 'application/octet-stream';
    let entityId = '';
    let rawType = 'employee';

    if (options.body instanceof FormData) {
      const fileVal = options.body.get('file');
      if (fileVal instanceof File) {
        fileName = fileVal.name;
        fileType = fileVal.type;
      }
      entityId = (options.body.get('entity_id') as string) || '';
      rawType = (options.body.get('entity_type') as string) || 'employee';
    }

    const entityType = (rawType === 'employees' || rawType === 'employee') ? 'employee' : 'client';

    const newAttachment: Attachment = {
      id: 'demo-attach-' + Math.random().toString(36).substring(2, 11),
      entity_type: entityType,
      entity_id: entityId,
      file_name: fileName,
      file_path: `${entityType}/${entityId}/${fileName}`,
      mime_type: fileType,
    };
    demoAttachmentsDb.push(newAttachment);
    return { handled: true, result: newAttachment };
  }

  if (path.startsWith('/attachments/') && options.method === 'DELETE') {
    const attachId = path.split('/').pop() || '';
    const index = demoAttachmentsDb.findIndex(att => att.id === attachId);
    if (index !== -1) {
      demoAttachmentsDb.splice(index, 1);
    }
    return { handled: true, result: {} };
  }

  return null;
});

const normalizeAttachment = (att: any): Attachment => {
  if (!att) return att;
  return {
    ...att,
    id: att.id,
    entity_type: att.entity_type || att.entityType,
    entity_id: att.entity_id || att.entityId,
    file_name: att.file_name || att.fileName,
    file_path: att.file_path || att.filePath,
    mime_type: att.mime_type || att.mimeType,
  };
};

export const attachmentsApi = {
  listForEntity: async (entityType: 'employee' | 'client', entityId: string) => {
    const backendType = entityType === 'employee' ? 'employees' : 'clients';
    const data = await request<Attachment[]>(`/attachments/entity/${backendType}/${entityId}`, { method: 'GET' });
    return (data || []).map(normalizeAttachment);
  },

  upload: async (file: File, entityType: 'employee' | 'client', entityId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    const backendType = entityType === 'employee' ? 'employees' : 'clients';
    formData.append('entity_type', backendType);
    formData.append('entity_id', entityId);
    const data = await request<Attachment>('/attachments/upload', {
      method: 'POST',
      body: formData
    });
    return normalizeAttachment(data);
  },

  delete: (id: string) =>
    requestNoContent(`/attachments/${id}`, { method: 'DELETE' }),

  download: async (id: string): Promise<Blob> => {
    if (isDemoMode()) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const attachment = demoAttachmentsDb.find(att => att.id === id);
      const content = `Simulated secure content for document: ${attachment?.file_name || 'Doc'}`;
      return new Blob([content], { type: attachment?.mime_type || 'text/plain' });
    }

    const url = `${BASE_URL}/attachments/download/${id}`;
    const headers = new Headers();
    const token = tokenStore.getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error('Download failed');
    }
    return response.blob();
  }
};
