
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  description: string;
  className?: string;
  iconClassName?: string;
  onClick?: () => void;
}

export const StatsCard = ({
  title,
  value,
  icon: Icon,
  description,
  className,
  iconClassName,
  onClick
}: StatsCardProps) => {
  // Handle both click and keyboard navigation for accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick();
    }
  };
  
  // If onClick is provided, make the card a button for better accessibility
  const CardComponent = onClick ? 'button' : 'div';
  
  return (
    <CardComponent 
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`w-full ${onClick ? "cursor-pointer transition-transform hover:scale-[1.01]" : ""}`}
      aria-label={onClick ? `${title}: ${value} - ${description}` : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          {onClick && (
            <VisuallyHidden>
              <CardTitle>Navegação</CardTitle>
            </VisuallyHidden>
          )}
          <CardTitle className="text-sm font-medium text-rose-700">{title}</CardTitle>
          <Icon className={`h-4 w-4 ${iconClassName}`} aria-hidden="true" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </CardComponent>
  );
};
