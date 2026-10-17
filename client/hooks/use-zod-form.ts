"use client";

import { useCallback, useState } from "react";
import { ZodType } from "zod";

interface UseZodFormOptions<T extends Record<string, any>> {
  schema: ZodType<T>;
  defaultValues: T;
  onSubmit: (values: T) => void | Promise<void>;
}

export function useZodForm<T extends Record<string, any>>({
  schema,
  defaultValues,
  onSubmit,
}: UseZodFormOptions<T>) {
  const [values, setValues] = useState<T>(defaultValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setFieldValue = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      setValues((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => {
        if (!prev[field]) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      });
    },
    [],
  );

  const handleBlur = useCallback(
    (field: keyof T) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      const result = schema.safeParse(values);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path[0] === field);
        if (issue) {
          setErrors((prev) => ({ ...prev, [field]: issue.message }));
        }
      }
    },
    [schema, values],
  );

  const validate = useCallback((): T | null => {
    const result = schema.safeParse(values);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof T, string>> = {};
      for (const issue of result.error.issues) {
        const fieldKey = issue.path[0] as keyof T;
        if (fieldKey && !fieldErrors[fieldKey]) {
          fieldErrors[fieldKey] = issue.message;
        }
      }
      setErrors(fieldErrors);
      const allTouched: Partial<Record<keyof T, boolean>> = {};
      Object.keys(fieldErrors).forEach((key) => {
        allTouched[key as keyof T] = true;
      });
      setTouched((prev) => ({ ...prev, ...allTouched }));
      return null;
    }
    setErrors({});
    return result.data;
  }, [schema, values]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      const validData = validate();
      if (!validData) return;

      setIsSubmitting(true);
      try {
        await onSubmit(validData);
      } finally {
        setIsSubmitting(false);
      }
    },
    [validate, onSubmit],
  );

  const reset = useCallback(
    (newValues?: T) => {
      setValues(newValues || defaultValues);
      setErrors({});
      setTouched({});
      setIsSubmitting(false);
    },
    [defaultValues],
  );

  return {
    values,
    setValues,
    setFieldValue,
    errors,
    touched,
    handleBlur,
    validate,
    handleSubmit,
    isSubmitting,
    reset,
  };
}
