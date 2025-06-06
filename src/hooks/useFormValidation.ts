
import { useState, useCallback, useMemo } from 'react';
import { useErrorHandler } from '@/hooks/useErrorHandler';

export interface ValidationRule<T> {
  field: keyof T;
  validator: (value: any, formData: T) => string | null;
  message?: string;
}

export interface UseFormValidationOptions<T> {
  rules: ValidationRule<T>[];
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export const useFormValidation = <T extends Record<string, any>>(
  initialData: T,
  options: UseFormValidationOptions<T>
) => {
  const [formData, setFormData] = useState<T>(initialData);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const { handleError } = useErrorHandler();

  // Validate a single field
  const validateField = useCallback((field: keyof T, value: any): string | null => {
    const rule = options.rules.find(r => r.field === field);
    if (!rule) return null;
    
    try {
      return rule.validator(value, formData);
    } catch (error) {
      handleError(error, `Erro na validação do campo ${String(field)}`);
      return 'Erro na validação';
    }
  }, [options.rules, formData, handleError]);

  // Validate all fields
  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    options.rules.forEach(rule => {
      const error = validateField(rule.field, formData[rule.field]);
      if (error) {
        newErrors[rule.field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [options.rules, formData, validateField]);

  // Update field value
  const updateField = useCallback((field: keyof T, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (options.validateOnChange) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  }, [options.validateOnChange, validateField]);

  // Handle field blur
  const handleBlur = useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    if (options.validateOnBlur) {
      const error = validateField(field, formData[field]);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  }, [options.validateOnBlur, validateField, formData]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData(initialData);
    setErrors({});
    setTouched({});
  }, [initialData]);

  // Check if form is valid
  const isValid = useMemo(() => {
    return Object.values(errors).every(error => !error);
  }, [errors]);

  // Get field error (only show if touched)
  const getFieldError = useCallback((field: keyof T): string | null => {
    return touched[field] ? errors[field] || null : null;
  }, [errors, touched]);

  return {
    formData,
    errors,
    touched,
    isValid,
    updateField,
    handleBlur,
    validateForm,
    resetForm,
    getFieldError,
    setFormData
  };
};

// Common validation rules
export const validationRules = {
  required: (message = 'Este campo é obrigatório') => 
    (value: any) => !value || value.toString().trim() === '' ? message : null,
  
  email: (message = 'Email inválido') => 
    (value: string) => value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? message : null,
  
  phone: (message = 'Telefone inválido') => 
    (value: string) => value && !/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(value) ? message : null,
  
  minLength: (min: number, message?: string) => 
    (value: string) => value && value.length < min ? 
      message || `Deve ter pelo menos ${min} caracteres` : null,
  
  maxLength: (max: number, message?: string) => 
    (value: string) => value && value.length > max ? 
      message || `Deve ter no máximo ${max} caracteres` : null,
  
  numeric: (message = 'Deve ser um número válido') => 
    (value: any) => value && isNaN(Number(value)) ? message : null,
  
  positiveNumber: (message = 'Deve ser um número positivo') => 
    (value: any) => value && Number(value) <= 0 ? message : null,
};
