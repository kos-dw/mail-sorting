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
export interface CustomFieldType {
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

//
export type RecordListTypeOfNotion = {
  object: "list";
  results: [
    {
      object: string;
      properties: {
        tick: {
          id: "B%5C%3D%5B";
          type: "checkbox";
          checkbox: boolean;
        };
        url: {
          id: "Irfl";
          type: "url";
          url: string;
        };
        due_date: {
          id: "MDRq";
          type: "date";
          date: {
            start: string;
          };
        };
        uid: {
          id: "ZvRC";
          type: "formula";
          formula: {
            type: "string";
            string: string;
          };
        };
        thread_id: {
          id: "%5BL_M";
          type: "rich_text";
          rich_text: [
            {
              type: "text";
              text: {
                content: string;
              };
            },
          ];
        };
        type: {
          id: "bnda";
          type: "select";
          select: {
            name: string;
          };
        };
        item_title: {
          id: "title";
          type: "title";
          title: [
            {
              type: "text";
              text: {
                content: string;
              };
            },
          ];
        };
      };
    },
  ];
};
