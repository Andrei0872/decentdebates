import { UpdateTicketDTO } from "./dtos/update-ticket.dto";

export interface ModeratorActivity {
  ticketId: number;
  boardList: string;
  ticketTitle: string;
  moderatorId: number;
  ticketLabel: string;
  moderatorUsername: string;
}

export interface UpdateTicketData {
  ticketId: string;
  ticketData: UpdateTicketDTO;
  userId: number;
}