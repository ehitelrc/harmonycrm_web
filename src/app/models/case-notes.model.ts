// src/app/models/case-note.model.ts
export interface CaseNote {
  id: number | null; // null for new notes
  case_id: number;
  author_id: number;
  note: string;
  created_at: string | null; // ISO string
}