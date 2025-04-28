
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarX, Plus, Edit, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CancellationReason } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { tableNames } from "@/integrations/supabase/type-utils";
import { DbCancellationReason } from "@/integrations/supabase/database-types";

const CancellationReasonsPage: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [reasons, setReasons] = useState<CancellationReason[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingReason, setEditingReason] = useState<CancellationReason | null>(null);
  const [reasonInput, setReasonInput] = useState("");
  const { toast } = useToast();

  // Fetch cancellation reasons on component mount
  useEffect(() => {
    fetchCancellationReasons();
  }, []);

  const fetchCancellationReasons = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(tableNames.motivos_cancelamento)
        .select('*')
        .order('reason', { ascending: true });
        
      if (error) throw error;
      
      // Map the database objects to the application's CancellationReason type
      const mappedReasons: CancellationReason[] = (data || []).map((item: DbCancellationReason) => ({
        id: item.id,
        reason: item.reason
      }));
      
      setReasons(mappedReasons);
    } catch (error: any) {
      console.error("Error fetching cancellation reasons:", error.message);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os motivos de cancelamento",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (reason: CancellationReason) => {
    setEditingReason(reason);
    setReasonInput(reason.reason);
    setOpen(true);
  };

  const handleOpenNew = () => {
    setEditingReason(null);
    setReasonInput("");
    setOpen(true);
  };

  const handleSave = async () => {
    if (!reasonInput.trim()) {
      toast({
        title: "Erro",
        description: "O motivo não pode estar vazio",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      if (editingReason) {
        // Update existing reason
        const { data, error } = await supabase
          .from(tableNames.motivos_cancelamento)
          .update({ reason: reasonInput })
          .eq('id', editingReason.id)
          .select();
          
        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Motivo de cancelamento atualizado"
        });
        
        // Update local state
        setReasons(reasons.map(r => 
          r.id === editingReason.id ? { ...r, reason: reasonInput } : r
        ));
      } else {
        // Add new reason
        const { data, error } = await supabase
          .from(tableNames.motivos_cancelamento)
          .insert({ reason: reasonInput })
          .select();
          
        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Motivo de cancelamento adicionado"
        });
        
        // Add to local state if we got data back
        if (data && data.length > 0) {
          const newReasons = data.map((item: DbCancellationReason) => ({
            id: item.id,
            reason: item.reason
          }));
          setReasons([...reasons, ...newReasons]);
        } else {
          // If we didn't get data back, refresh the list
          fetchCancellationReasons();
        }
      }
      
      setOpen(false);
      setReasonInput("");
      setEditingReason(null);
    } catch (error: any) {
      console.error("Error saving cancellation reason:", error.message);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o motivo de cancelamento",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este motivo de cancelamento?")) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from(tableNames.motivos_cancelamento)
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Motivo de cancelamento excluído"
      });
      
      // Update local state
      setReasons(reasons.filter(r => r.id !== id));
    } catch (error: any) {
      console.error("Error deleting cancellation reason:", error.message);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o motivo de cancelamento",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <CalendarX className="h-6 w-6 mr-2" />
          <h1 className="font-bold text-lg">Motivos Prontos</h1>
        </div>
        <Button onClick={handleOpenNew} className="text-sm px-[10px]" disabled={loading}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Motivo
        </Button>
      </div>
      
      {loading && reasons.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {reasons.map(reason => (
            <Card key={reason.id}>
              <CardContent className="p-4 flex justify-between items-center">
                <p>{reason.reason}</p>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(reason)} disabled={loading}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDelete(reason.id)}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && reasons.length === 0 && (
        <div className="text-center py-10 bg-accent/10 rounded-lg mt-4">
          <p className="text-muted-foreground">Nenhum motivo de cancelamento cadastrado.</p>
        </div>
      )}
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingReason ? 'Editar Motivo' : 'Novo Motivo'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo</Label>
              <Input 
                id="reason" 
                placeholder="Digite o motivo de cancelamento" 
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={loading || !reasonInput.trim()}>
                {loading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CancellationReasonsPage;
