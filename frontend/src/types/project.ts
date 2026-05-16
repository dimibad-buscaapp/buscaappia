export interface Project {
  id: number;
  user_id: number;
  name: string;
  type: 'web' | 'apk' | 'exe' | 'apk_editor' | string;
  status: string;
  config: string | null;
  created_at: string;
}
