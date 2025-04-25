
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { Client } from '@/types';
import { createClientInApi, updateClientInApi } from '@/services/clientApi';

export interface ClientFormProps {
  client?: Client;
  onSuccess: () => void;
  onCancel: () => void;
}

const ClientForm: React.FC<ClientFormProps> = ({ client, onSuccess, onCancel }) => {
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [birthdate, setBirthdate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form if editing an existing client
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
        email: email || undefined,
        birthdate: birthdate ? new Date(birthdate).toISOString() : undefined,
        notes: notes || undefined
      };
      
      let result;
      
      if (client) {
        // Update existing client
        console.log("Updating client:", client.id, clientData);
        result = await updateClientInApi(client.id, clientData);
      } else {
        // Create new client
        console.log("Creating new client:", clientData);
        result = await createClientInApi(clientData);
      }
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      console.log("Client saved successfully");
      onSuccess();
    } catch (error: any) {
      console.error('Error saving client:', error);
      setErrors({ submit: error.message || 'Falha ao salvar cliente' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPhoneInput = (value: string) => {
    // Remove non-numeric characters
    const numericValue = value.replace(/\D/g, '');
    
    // Format as (XX) XXXXX-XXXX or (XX) XXXX-XXXX depending on length
    if (numericValue.length <= 10) {
      if (numericValue.length <= 2) return numericValue;
      if (numericValue.length <= 6) return `(${numericValue.slice(0, 2)}) ${numericValue.slice(2)}`;
      return `(${numericValue.slice(0, 2)}) ${numericValue.slice(2, 6)}-${numericValue.slice(6)}`;
    } else {
      return `(${numericValue.slice(0, 2)}) ${numericValue.slice(2, 7)}-${numericValue.slice(7, 11)}`;
    }
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
      
      <div className="flex justify-end gap-2">
        <Button 
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button 
          type="submit"
          className="bg-nail-500 hover:bg-nail-600"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Salvando...' : client ? 'Atualizar' : 'Cadastrar'}
        </Button>
      </div>
    </form>
  );
};

export default ClientForm;
