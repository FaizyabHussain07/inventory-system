"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '../integrations/supabase/client';
import { useSession } from './SessionContextProvider';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { DialogFooter } from './ui/dialog';
import { showError, showSuccess, showLoading, dismissToast } from '../utils/toast';

const retailerSchema = z.object({
  name: z.string().min(1, "Retailer name is required"),
  contact_email: z.string().email("Invalid email address").optional().or(z.literal('')),
});

type RetailerFormValues = z.infer<typeof retailerSchema>;

interface Retailer {
  id: string;
  name: string;
  contact_email: string | null;
  admin_id: string;
  created_at: string;
}

interface RetailerFormProps {
  initialRetailer?: Retailer; // Optional prop for editing
  onRetailerSaved: () => void;
  onClose: () => void;
}

const RetailerForm = ({ initialRetailer, onRetailerSaved, onClose }: RetailerFormProps) => {
  const { session } = useSession();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<RetailerFormValues>({
    resolver: zodResolver(retailerSchema),
    defaultValues: initialRetailer || {
      name: '',
      contact_email: '',
    },
  });

  useEffect(() => {
    // Reset form with initialRetailer data when it changes (for editing)
    reset(initialRetailer || {
      name: '',
      contact_email: '',
    });
  }, [initialRetailer, reset]);

  const onSubmit = async (values: RetailerFormValues) => {
    if (!session?.user?.id) {
      showError("You must be logged in to manage retailers.");
      return;
    }

    const toastId = showLoading(initialRetailer ? "Updating retailer..." : "Adding retailer...");

    try {
      let error = null;
      if (initialRetailer) {
        // Update existing retailer
        const { error: updateError } = await supabase
          .from('retailers')
          .update(values)
          .eq('id', initialRetailer.id)
          .eq('admin_id', session.user.id); // Ensure only admin can update their own retailer
        error = updateError;
      } else {
        // Insert new retailer
        const { error: insertError } = await supabase
          .from('retailers')
          .insert({
            ...values,
            admin_id: session.user.id,
          });
        error = insertError;
      }

      if (error) {
        throw error;
      }

      showSuccess(initialRetailer ? "Retailer updated successfully!" : "Retailer added successfully!");
      reset();
      onRetailerSaved();
      onClose();
    } catch (error: any) {
      console.error("Error saving retailer:", error);
      showError(`Failed to save retailer: ${error.message || 'Unknown error'}`);
    } finally {
      dismissToast(toastId);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Retailer Name</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <Label htmlFor="contact_email">Contact Email (Optional)</Label>
        <Input id="contact_email" type="email" {...register("contact_email")} />
        {errors.contact_email && <p className="text-red-500 text-sm mt-1">{errors.contact_email.message}</p>}
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (initialRetailer ? "Updating..." : "Adding...") : (initialRetailer ? "Save Changes" : "Add Retailer")}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default RetailerForm;