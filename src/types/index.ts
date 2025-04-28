
// Add this to your types file or update the existing BlockedDate type
export interface BlockedDate {
  id: string;
  date: string | Date;
  reason?: string;
  motivo?: string;
  description?: string;
  allDay: boolean;
  dia_todo: boolean;
  valor?: string; // To store start time
}
