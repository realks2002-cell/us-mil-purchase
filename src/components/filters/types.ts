export interface Filter {
  id: number;
  userId: string;
  name: string;
  keywords: string[] | null;
  naicsCodes: string[] | null;
  noticeTypes: string[] | null;
  setAsides: string[] | null;
  departments: string[] | null;
  isActive: boolean;
  notifyEmail: boolean;
  createdAt: Date;
  updatedAt: Date;
}
