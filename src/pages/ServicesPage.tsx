import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServiceList } from "@/components/ServiceList";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { ServiceForm } from "@/components/ServiceForm";
import { Plus } from "lucide-react";
export default function ServicesPage() {
  const [showAddService, setShowAddService] = useState(false);
  return <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="tracking-tight px-0 text-lg mx-[15px] font-bold">Cadastre Serviços</h1>
        <Button onClick={() => setShowAddService(true)} className="bg-primary hover:bg-primary/90 gap-2 mx-[15px]">
          <Plus className="h-4 w-4" />
          Novo Serviço
        </Button>
      </div>
      
      <div className="grid gap-6">
        <ServiceList />
      </div>
      
      {/* Only render dialog when state is true */}
      {showAddService && <Dialog open={showAddService} onOpenChange={setShowAddService}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Serviço</DialogTitle>
            </DialogHeader>
            <ServiceForm onSuccess={() => setShowAddService(false)} />
          </DialogContent>
        </Dialog>}
    </div>;
}