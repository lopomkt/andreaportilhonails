
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  return (
    <Card 
      className={`${className} ${onClick ? "cursor-pointer transition-transform hover:scale-[1.01]" : ""}`} 
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-rose-700">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconClassName}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
};
