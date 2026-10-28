"use client"
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { ReactNode } from 'react';

export const MyField = (value: {
  name: string,
  label?: ReactNode,
  className?: string,
  placeholder?: string,
  description?: ReactNode,
  required?: boolean,
  fields?: any,
  form?: any,
  input?: (field: any) => ReactNode
}) => {
  return <FormField
    control={value?.form.control}
    name={value.name as any}
    render={({ field }: { field: any }) => (
      <FormItem
        className={value?.className}
      >
        {value?.label && (
          <FormLabel>
            {value.label}
            {value.required ? <span aria-hidden className="ml-0.5 text-destructive">*</span> : null}
          </FormLabel>
        )}
        <FormControl>
          {value?.input ? value.input(field) :
            <Input placeholder={value?.placeholder} {...field} {...value?.fields} />
          }
        </FormControl>
        {value?.description && <FormDescription>{value.description}</FormDescription>}
        <FormMessage />
      </FormItem>
    )}
  />
}
