import React, { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { format } from 'date-fns';
import { Client } from '@/types';
import { Trash2 } from 'lucide-react';

export interface ClientFormProps {
  client?: Client;
  onSuccess: (client: Client | null) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const ClientForm: React.FC<ClientFormProps> = ({ client, onSuccess, onCancel, onDelete }) => {
  const { createClient, updateClient } = useData();
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [birthdate, setBirthdate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (client) {
      setName(client.name || '');
      setPhone(client.phone || '');
      setEmail(client.email || '');
      setBirthdate(client.birthdate ? format(new Date(client.birthdate), 'yyyy-MM-dd') : '');
      setNotes(client.notes || '');
    }
  }, [client]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    } else if (!/^\d{10,11}$/.test(phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Telefone inválido';
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      console.log("Form submitted with data:", { name, phone, email, birthdate, notes });
      
      const clientData = {
        name,
        phone: phone.replace(/\D/g, ''),
        email: email || null,
        birthdate: birthdate ? new Date(birthdate).toISOString() : null,
        notes: notes || null
      };
      
      if (client) {
        console.log("Updating client:", client.id, clientData);
        const result = await updateClient(client.id, clientData);
        if (result.error) {
          console.error("Update client failed:", result.error);
          throw new Error(result.error);
        }
        const updatedClient = { ...client, ...clientData };
        onSuccess(updatedClient);
      } else {
        console.log("Creating new client:", clientData);
        const result = await createClient(clientData);
        if (result.error) {
          console.error("Create client failed:", result.error);
          throw new Error(result.error);
        }
        onSuccess(result.data || null);
      }
      
      console.log("Client saved successfully");
    } catch (error: any) {
      console.error('Error saving client:', error);
      setErrors({ submit: error.message || 'Falha ao salvar cliente' });
      onSuccess(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPhoneInput = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    
    if (numericValue.length <= 10) {
      if (numericValue.length <= 2) return numericValue;
      if (numericValue.length <= 6) return `(${numericValue.slice(0, 2)}) ${numericValue.slice(2)}`;
      return `(${numericValue.slice(0, 2)}) ${numericValue.slice(2, 6)}-${numericValue.slice(6)}`;
    } else {
      return `(${numericValue.slice(0, 2)}) ${numericValue.slice(2, 7)}-${numericValue.slice(7, 11)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatPhoneInput(e.target.value);
    setPhone(formattedValue);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome *</Label>
          <Input 
            id="name"
            placeholder="Nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={errors.name ? "border-destructive" : ""}
          />
          {errors.name && <p className="text-destructive text-sm">{errors.name}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone *</Label>
          <Input 
            id="phone"
            placeholder="(00) 00000-0000"
            value={phone}
            onChange={(e) => {
              const formattedValue = formatPhoneInput(e.target.value);
              setPhone(formattedValue);
            }}
            required
            className={errors.phone ? "border-destructive" : ""}
          />
          {errors.phone && <p className="text-destructive text-sm">{errors.phone}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email"
            type="email"
            placeholder="email@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={errors.email ? "border-destructive" : ""}
          />
          {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="birthdate">Data de Nascimento</Label>
          <Input 
            id="birthdate"
            type="date"
            value={birthdate}
            onChange={(e) => setBirthdate(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="notes">Observações</Label>
          <Textarea 
            id="notes"
            placeholder="Adicione informações importantes sobre o cliente..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
        </div>
      </div>
      
      {errors.submit && <p className="text-destructive text-sm">{errors.submit}</p>}
      
      <div className="flex justify-between">
        {client && onDelete ? (
          <Button 
            type="button"
            variant="destructive"
            onClick={onDelete}
            className="gap-1"
          >
            <Trash2 className="h-4 w-4" />
            Excluir Cliente
          </Button>
        ) : (
          <Button 
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancelar
          </Button>
        )}
        
        <div className="flex gap-2">
          {client && (
            <Button 
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancelar
            </Button>
          )}
          <Button 
            type="submit"
            className="bg-nail-500 hover:bg-nail-600"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : client ? 'Atualizar' : 'Cadastrar'}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default ClientForm;
