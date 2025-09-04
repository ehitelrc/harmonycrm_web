// Vista: case_notes_view (mantengo snake_case para mapear 1:1 con la API)
export interface CaseNoteView {
  id: number;
  case_id: number | null;
  author_id: number | null;
  author_name: string | null;
  author_email: string | null;
  note: string | null;
  created_at: string | null; // ISO
}