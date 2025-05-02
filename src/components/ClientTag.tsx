
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Client } from "@/types";

export type ClientTagType = "vip" | "punctual" | "defaulter" | "inactive";

interface ClientTagProps {
  type: ClientTagType;
  showLabel?: boolean;
}

const tagConfig = {
  vip: {
    icon: "⭐",
    label: "Cliente VIP",
    description: "Gasta acima da média",
    className: "bg-rose-100 text-rose-800 border-rose-200"
  },
  punctual: {
    icon: "⏰",
    label: "Pontual",
    description: "Sempre chega no horário",
    className: "bg-green-100 text-green-800 border-green-200"
  },
  defaulter: {
    icon: "💸",
    label: "Inadimplente",
    description: "Cancelamentos recorrentes",
    className: "bg-red-100 text-red-800 border-red-200"
  },
  inactive: {
    icon: "😴",
    label: "Sumida",
    description: "+30 dias sem agendamento",
    className: "bg-gray-100 text-gray-600 border-gray-200"
  }
};

export const ClientTag = ({ type, showLabel = false }: ClientTagProps) => {
  const config = tagConfig[type];
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`px-2 py-0.5 ${config.className}`}>
            <span className="mr-0.5">{config.icon}</span>
            {showLabel && <span className="ml-1">{config.label}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            <span className="font-medium">{config.label}: </span>
            {config.description}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const getClientTags = (client: Client): ClientTagType[] => {
  const tags: ClientTagType[] = [];
  
  // Check for VIP clients (above average spending)
  if (client.totalSpent > 500) {
    tags.push("vip");
  }
  
  // Check for inactive clients (no appointments for 40+ days)
  if (!client.lastAppointment || new Date().getTime() - new Date(client.lastAppointment).getTime() > 40 * 24 * 60 * 60 * 1000) {
    tags.push("inactive");
  }
  
  // Note: For punctual and defaulter tags, we would need more data
  // These are placeholder logic that should be replaced with real business logic
  
  return tags;
};
