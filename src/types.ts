// Gmailのメール情報
export interface JsonDto {
  uniqueId: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  threadId: string;
  messageId: string;
  receivedAt: string;
  searchQuery: string;
  link: string;
}

// Jiraのカスタムフィールド情報
export interface CustomField {
  uniqueId: string;
  threadId: string;
  messageId: string;
  receivedAt: string;
  from: string;
  to: string;
  searchQuery: string;
  link: string;
}

// スプレッドシートの行情報
export type JsonRow = [
  uniqueId: string,
  from: string,
  to: string,
  subject: string,
  body: string,
  threadId: string,
  messageId: string,
  receivedAt: string,
  searchQuery: string,
  link: string,
];
