import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { QuoteIcon } from "lucide-react";
import { useData } from "@/context/DataProvider";

export const MotivationalMessage = () => {
  const { motivationalMessages } = useData();
  const [currentMessageIndex, setCurrentMessageIndex] = useState<number>(0);
  
  useEffect(() => {
    if (!motivationalMessages || motivationalMessages.length === 0) return;
    
    // Check if we need to rotate the message (12 hours have passed)
    const lastMotivationTime = localStorage.getItem("lastMotivationTime");
    const currentTime = Date.now();
    const twelveHoursInMs = 12 * 60 * 60 * 1000;
    
    // Get stored index or use 0 as default
    let storedIndex = parseInt(localStorage.getItem("motivationMessageIndex") || "0");
    
    // If 12 hours passed or no last time is stored, rotate to next message
    if (!lastMotivationTime || (currentTime - parseInt(lastMotivationTime)) > twelveHoursInMs) {
      // Move to the next message
      storedIndex = (storedIndex + 1) % motivationalMessages.length;
      
      // Update localStorage
      localStorage.setItem("motivationMessageIndex", storedIndex.toString());
      localStorage.setItem("lastMotivationTime", currentTime.toString());
    }
    
    setCurrentMessageIndex(storedIndex);
    
    // Schedule check every hour in case the user keeps the page open
    const intervalId = setInterval(() => {
      const newCurrentTime = Date.now();
      const lastSetTime = localStorage.getItem("lastMotivationTime");
      
      if (lastSetTime && (newCurrentTime - parseInt(lastSetTime)) > twelveHoursInMs) {
        const newIndex = (parseInt(localStorage.getItem("motivationMessageIndex") || "0") + 1) % motivationalMessages.length;
        localStorage.setItem("motivationMessageIndex", newIndex.toString());
        localStorage.setItem("lastMotivationTime", newCurrentTime.toString());
        setCurrentMessageIndex(newIndex);
      }
    }, 60 * 60 * 1000); // Check once per hour
    
    return () => clearInterval(intervalId);
  }, [motivationalMessages]);
  
  if (!motivationalMessages || motivationalMessages.length === 0) {
    return null;
  }
  
  return (
    <Card className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0 shadow-md">
      <CardContent className="p-4 flex items-center space-x-4">
        <QuoteIcon className="h-8 w-8 flex-shrink-0 opacity-80" />
        <p className="text-sm md:text-base italic">
          {motivationalMessages[currentMessageIndex]?.message || 
           "Acredite em você! O sucesso começa quando você decide tentar."}
        </p>
      </CardContent>
    </Card>
  );
};
