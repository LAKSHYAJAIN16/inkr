export type DocVersionMeta = {
  id: string; // uuid
  createdAt: string; // ISO string
  author?: string;
  ai: {
    flagged: boolean;
    confidence: number; // 0..1
    reasons: string[];
    model?: string;
  };
};

export type DocVersion = DocVersionMeta & {
  content: string; // ProseMirror JSON or HTML string; we will store JSON string
};

export type DocSummary = {
  id: string;
  title: string;
  updatedAt: string;
  latestAIFlag: boolean;
};

export type Doc = {
  id: string;
  title: string;
  current: DocVersion;
  versions: DocVersionMeta[]; // metadata for history; full versions stored separately
};


