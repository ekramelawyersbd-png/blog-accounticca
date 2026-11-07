import { getAccessToken } from './workspaceAuth';

const checkToken = () => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('No Google Workspace access token found. Please sign in with Google Workspace.');
  }
  return token;
};

// ──────────────────────────────────────────
// 📁 Google Drive API
// ──────────────────────────────────────────
export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  iconLink?: string;
  modifiedTime?: string;
  size?: string;
}

export const workspaceDriveApi = {
  listFiles: async (pageSize: number = 20, q?: string): Promise<DriveFile[]> => {
    const token = checkToken();
    let url = `https://www.googleapis.com/drive/v3/files?pageSize=${pageSize}&fields=files(id,name,mimeType,webViewLink,iconLink,modifiedTime,size)&orderBy=modifiedTime desc`;
    if (q) {
      url += `&q=${encodeURIComponent(q)}`;
    }
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to fetch Drive files (${res.status})`);
    }
    const data = await res.json();
    return data.files || [];
  },

  createFile: async (name: string, content: string, mimeType: string = 'text/plain'): Promise<DriveFile> => {
    const token = checkToken();
    const metadata = { name, mimeType };
    
    // Multipart upload
    const boundary = 'foo_bar_baz';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;
    
    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType}\r\n\r\n` +
      content +
      closeDelimiter;

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body: multipartRequestBody
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to create file (${res.status})`);
    }
    return res.json();
  },

  deleteFile: async (fileId: string): Promise<void> => {
    const token = checkToken();
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to delete file (${res.status})`);
    }
  }
};

// ──────────────────────────────────────────
// 📊 Google Sheets API
// ──────────────────────────────────────────
export interface SpreadsheetMeta {
  spreadsheetId: string;
  properties: {
    title: string;
  };
  sheets: Array<{
    properties: {
      sheetId: number;
      title: string;
    };
  }>;
}

export const workspaceSheetsApi = {
  createSpreadsheet: async (title: string): Promise<SpreadsheetMeta> => {
    const token = checkToken();
    const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: { title }
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to create spreadsheet (${res.status})`);
    }
    return res.json();
  },

  getSpreadsheet: async (spreadsheetId: string): Promise<SpreadsheetMeta> => {
    const token = checkToken();
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to fetch spreadsheet (${res.status})`);
    }
    return res.json();
  },

  getValues: async (spreadsheetId: string, range: string): Promise<any[][]> => {
    const token = checkToken();
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to read sheet values (${res.status})`);
    }
    const data = await res.json();
    return data.values || [];
  },

  appendValues: async (spreadsheetId: string, range: string, values: any[][]): Promise<any> => {
    const token = checkToken();
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to append values (${res.status})`);
    }
    return res.json();
  }
};

// ──────────────────────────────────────────
// 📅 Google Calendar API
// ──────────────────────────────────────────
export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
  location?: string;
}

export const workspaceCalendarApi = {
  listEvents: async (maxResults: number = 25): Promise<CalendarEvent[]> => {
    const token = checkToken();
    const now = new Date().toISOString();
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=${maxResults}&orderBy=startTime&singleEvents=true&timeMin=${encodeURIComponent(now)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to load calendar events (${res.status})`);
    }
    const data = await res.json();
    return data.items || [];
  },

  createEvent: async (event: {
    summary: string;
    description?: string;
    location?: string;
    start: { dateTime: string };
    end: { dateTime: string };
  }): Promise<CalendarEvent> => {
    const token = checkToken();
    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to create calendar event (${res.status})`);
    }
    return res.json();
  },

  deleteEvent: async (eventId: string): Promise<void> => {
    const token = checkToken();
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to delete calendar event (${res.status})`);
    }
  }
};

// ──────────────────────────────────────────
// 📝 Google Docs API
// ──────────────────────────────────────────
export interface GoogleDocument {
  documentId: string;
  title: string;
  body?: any;
}

export const workspaceDocsApi = {
  createDocument: async (title: string): Promise<GoogleDocument> => {
    const token = checkToken();
    const res = await fetch('https://docs.googleapis.com/v1/documents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to create Google Doc (${res.status})`);
    }
    return res.json();
  },

  getDocument: async (documentId: string): Promise<GoogleDocument> => {
    const token = checkToken();
    const res = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to get Google Doc (${res.status})`);
    }
    return res.json();
  },

  insertText: async (documentId: string, text: string): Promise<any> => {
    const token = checkToken();
    const res = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text
            }
          }
        ]
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to insert text in doc (${res.status})`);
    }
    return res.json();
  }
};

// ──────────────────────────────────────────
// 📽️ Google Slides API
// ──────────────────────────────────────────
export const workspaceSlidesApi = {
  createPresentation: async (title: string): Promise<{ presentationId: string; title: string }> => {
    const token = checkToken();
    const res = await fetch('https://slides.googleapis.com/v1/presentations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to create presentation (${res.status})`);
    }
    return res.json();
  }
};

// ──────────────────────────────────────────
// ✅ Google Tasks API
// ──────────────────────────────────────────
export interface GoogleTask {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
}

export const workspaceTasksApi = {
  listTasks: async (tasklistId: string = '@default'): Promise<GoogleTask[]> => {
    const token = checkToken();
    const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${tasklistId}/tasks`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to load Google tasks (${res.status})`);
    }
    const data = await res.json();
    return data.items || [];
  },

  createTask: async (task: { title: string; notes?: string; due?: string }, tasklistId: string = '@default'): Promise<GoogleTask> => {
    const token = checkToken();
    const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${tasklistId}/tasks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(task)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to create task (${res.status})`);
    }
    return res.json();
  },

  updateTaskStatus: async (taskId: string, status: 'needsAction' | 'completed', tasklistId: string = '@default'): Promise<GoogleTask> => {
    const token = checkToken();
    const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${tasklistId}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to update task status (${res.status})`);
    }
    return res.json();
  },

  deleteTask: async (taskId: string, tasklistId: string = '@default'): Promise<void> => {
    const token = checkToken();
    const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${tasklistId}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to delete task (${res.status})`);
    }
  }
};

// ──────────────────────────────────────────
// 👥 Google Contacts (People API)
// ──────────────────────────────────────────
export interface GoogleContact {
  resourceName: string;
  etag?: string;
  names?: Array<{ displayName: string }>;
  emailAddresses?: Array<{ value: string; type?: string }>;
  phoneNumbers?: Array<{ value: string; type?: string }>;
  organizations?: Array<{ name: string; title?: string }>;
}

export const workspaceContactsApi = {
  listContacts: async (pageSize: number = 30): Promise<GoogleContact[]> => {
    const token = checkToken();
    const res = await fetch(`https://people.googleapis.com/v1/people/me/connections?pageSize=${pageSize}&personFields=names,emailAddresses,phoneNumbers,organizations`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to list contacts (${res.status})`);
    }
    const data = await res.json();
    return data.connections || [];
  },

  createContact: async (contact: {
    givenName: string;
    familyName?: string;
    email?: string;
    phone?: string;
    company?: string;
    jobTitle?: string;
  }): Promise<GoogleContact> => {
    const token = checkToken();
    const body: any = {
      names: [{ givenName: contact.givenName, familyName: contact.familyName || '' }]
    };
    if (contact.email) {
      body.emailAddresses = [{ value: contact.email, type: 'work' }];
    }
    if (contact.phone) {
      body.phoneNumbers = [{ value: contact.phone, type: 'work' }];
    }
    if (contact.company || contact.jobTitle) {
      body.organizations = [{ name: contact.company || '', title: contact.jobTitle || '' }];
    }

    const res = await fetch('https://people.googleapis.com/v1/people:createContact?personFields=names,emailAddresses,phoneNumbers,organizations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to create contact (${res.status})`);
    }
    return res.json();
  },

  deleteContact: async (resourceName: string): Promise<void> => {
    const token = checkToken();
    const res = await fetch(`https://people.googleapis.com/v1/${resourceName}:deleteContact`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to delete contact (${res.status})`);
    }
  }
};

// ──────────────────────────────────────────
// 📹 Google Meet API
// ──────────────────────────────────────────
export interface MeetSpace {
  name: string;
  meetingUri: string;
  meetingCode: string;
  config?: any;
}

export const workspaceMeetApi = {
  createMeetingSpace: async (): Promise<MeetSpace> => {
    const token = checkToken();
    const res = await fetch('https://meet.googleapis.com/v2/spaces', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to create Google Meet space (${res.status})`);
    }
    return res.json();
  }
};

// ──────────────────────────────────────────
// 🎓 Google Classroom API
// ──────────────────────────────────────────
export interface ClassroomCourse {
  id: string;
  name: string;
  section?: string;
  descriptionHeading?: string;
  room?: string;
  alternateLink?: string;
  courseState?: string;
}

export const workspaceClassroomApi = {
  listCourses: async (): Promise<ClassroomCourse[]> => {
    const token = checkToken();
    const res = await fetch('https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to fetch classroom courses (${res.status})`);
    }
    const data = await res.json();
    return data.courses || [];
  },

  createCourse: async (name: string, section?: string, descriptionHeading?: string): Promise<ClassroomCourse> => {
    const token = checkToken();
    const res = await fetch('https://classroom.googleapis.com/v1/courses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        section: section || 'Tax & Corporate Compliance',
        descriptionHeading: descriptionHeading || 'Accounticca Training & Legal Advisory'
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to create classroom course (${res.status})`);
    }
    return res.json();
  }
};

// ──────────────────────────────────────────
// 💬 Google Chat API
// ──────────────────────────────────────────
export interface ChatSpace {
  name: string;
  displayName?: string;
  type?: string;
  spaceThreadingState?: string;
}

export interface ChatMessage {
  name: string;
  text?: string;
  createTime?: string;
  sender?: {
    name?: string;
    displayName?: string;
    type?: string;
  };
}

export const workspaceChatApi = {
  listSpaces: async (): Promise<ChatSpace[]> => {
    const token = checkToken();
    const res = await fetch('https://chat.googleapis.com/v1/spaces', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to fetch Google Chat spaces (${res.status})`);
    }
    const data = await res.json();
    return data.spaces || [];
  },

  listMessages: async (spaceName: string, pageSize: number = 15): Promise<ChatMessage[]> => {
    const token = checkToken();
    const res = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages?pageSize=${pageSize}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to fetch messages from ${spaceName} (${res.status})`);
    }
    const data = await res.json();
    return data.messages || [];
  },

  createMessage: async (spaceName: string, text: string): Promise<ChatMessage> => {
    const token = checkToken();
    const res = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to send Google Chat message (${res.status})`);
    }
    return res.json();
  }
};

// ──────────────────────────────────────────
// 📋 Google Forms API
// ──────────────────────────────────────────
export const workspaceFormsApi = {
  createForm: async (title: string): Promise<{ formId: string; info: { title: string; documentTitle: string }; responderUri?: string }> => {
    const token = checkToken();
    const res = await fetch('https://forms.googleapis.com/v1/forms', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        info: {
          title,
          documentTitle: title
        }
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to create form (${res.status})`);
    }
    return res.json();
  }
};

// ──────────────────────────────────────────
// ✉️ Gmail API
// ──────────────────────────────────────────
export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet?: string;
  subject?: string;
  from?: string;
  date?: string;
}

export interface GmailProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

function encodeBase64Url(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export const workspaceGmailApi = {
  getProfile: async (): Promise<GmailProfile> => {
    const token = checkToken();
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to fetch Gmail profile (${res.status})`);
    }
    return res.json();
  },

  listMessages: async (maxResults: number = 15, q?: string): Promise<GmailMessageSummary[]> => {
    const token = checkToken();
    let url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`;
    if (q) {
      url += `&q=${encodeURIComponent(q)}`;
    }
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to list Gmail messages (${res.status})`);
    }
    const data = await res.json();
    const messages = data.messages || [];

    // Fetch message headers for previews
    const detailed = await Promise.all(
      messages.slice(0, 10).map(async (msg: { id: string; threadId: string }) => {
        try {
          const detailRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (!detailRes.ok) return { id: msg.id, threadId: msg.threadId };
          const detailData = await detailRes.json();
          const headers = detailData.payload?.headers || [];
          const subjectHeader = headers.find((h: any) => h.name.toLowerCase() === 'subject');
          const fromHeader = headers.find((h: any) => h.name.toLowerCase() === 'from');
          const dateHeader = headers.find((h: any) => h.name.toLowerCase() === 'date');
          return {
            id: msg.id,
            threadId: msg.threadId,
            snippet: detailData.snippet,
            subject: subjectHeader?.value || '(No Subject)',
            from: fromHeader?.value || 'Unknown',
            date: dateHeader?.value
          };
        } catch {
          return { id: msg.id, threadId: msg.threadId };
        }
      })
    );
    return detailed;
  },

  sendEmail: async (
    to: string,
    subject: string,
    bodyText: string,
    bodyHtml?: string
  ): Promise<{ id: string; threadId: string; labelIds: string[] }> => {
    const token = checkToken();
    const htmlContent = bodyHtml || bodyText.replace(/\n/g, '<br/>');
    const rfc822Lines = [
      `To: ${to}`,
      `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: 7bit',
      '',
      htmlContent
    ];
    const raw = encodeBase64Url(rfc822Lines.join('\r\n'));

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to send email via Gmail API (${res.status})`);
    }
    return res.json();
  }
};
