
import React from 'react';
import { useData } from '@/context/DataContext';
import { Client } from '@/types';
import { useClientForm } from './form/useClientForm';
import { ClientPersonalInfo } from './form/ClientPersonalInfo';
import { ClientNotes } from './form/ClientNotes';
import { ClientFormActions } from './form/ClientFormActions';

export interface ClientFormProps {
  client?: Client;
  onSuccess: () => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const ClientForm: React.FC<ClientFormProps> = ({ 
  client, 
  onSuccess, 
  onCancel, 
  onDelete 
}) => {
  const { createClient, updateClient } = useData();
  const {
    name,
    setName,
    phone,
    setPhone,
    email,
    setEmail,
    birthdate,
    setBirthdate,
    notes,
    setNotes,
    isSubmitting,
    setIsSubmitting,
    errors,
    setErrors,
    validateForm,
    formatPhoneInput
  } = useClientForm(client);

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
      
      if (client) {
        console.log("Updating client:", client.id, clientData);
        const result = await updateClient(client.id, clientData);
        if (result.error) throw new Error(result.error);
      } else {
        console.log("Creating new client:", clientData);
        const result = await createClient(clientData);
        if (result.error) throw new Error(result.error);
      }
      
      console.log("Client saved successfully");
      onSuccess();
    } catch (error: any) {
      console.error('Error saving client:', error);
      setErrors({ ...errors, submit: error.message || 'Falha ao salvar cliente' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4">
        <ClientPersonalInfo
          name={name}
          setName={setName}
          phone={phone}
          setPhone={setPhone}
          email={email}
          setEmail={setEmail}
          birthdate={birthdate}
          setBirthdate={setBirthdate}
          errors={errors}
          formatPhoneInput={formatPhoneInput}
        />
        
        <ClientNotes
          notes={notes}
          setNotes={setNotes}
        />
      </div>
      
      {errors.submit && <p className="text-destructive text-sm">{errors.submit}</p>}
      
      <ClientFormActions
        isSubmitting={isSubmitting}
        onCancel={onCancel}
        onDelete={onDelete}
        isEditing={!!client}
      />
    </form>
  );
};

export default ClientForm;
