
import { useState, useEffect } from 'react';
import { Client } from '@/types';
import { format } from 'date-fns';

export function useClientForm(client?: Client) {
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

  return {
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
  };
}
