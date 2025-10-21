"use client";

import React from 'react';
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

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  size: z.string().optional(),
  pieces_per_unit: z.preprocess(
    (val) => Number(val),
    z.number().int().positive("Pieces per unit must be a positive integer")
  ),
  current_stock_units: z.preprocess(
    (val) => Number(val),
    z.number().int().min(0, "Current stock units cannot be negative")
  ),
  wholesale_price_per_unit: z.preprocess(
    (val) => Number(val),
    z.number().positive("Wholesale price must be positive")
  ),
  sale_price_per_unit: z.preprocess(
    (val) => Number(val),
    z.number().positive("Sale price must be positive")
  ),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface AddProductFormProps {
  onProductAdded: () => void;
  onClose: () => void;
}

const AddProductForm = ({ onProductAdded, onClose }: AddProductFormProps) => {
  const { session } = useSession();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      size: '',
      pieces_per_unit: 1,
      current_stock_units: 0,
      wholesale_price_per_unit: 0,
      sale_price_per_unit: 0,
    },
  });

  const onSubmit = async (values: ProductFormValues) => {
    if (!session?.user?.id) {
      showError("You must be logged in to add a product.");
      return;
    }

    const toastId = showLoading("Adding product...");

    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          ...values,
          admin_id: session.user.id,
        })
        .select();

      if (error) {
        throw error;
      }

      showSuccess("Product added successfully!");
      reset();
      onProductAdded();
      onClose();
    } catch (error: any) {
      console.error("Error adding product:", error);
      showError(`Failed to add product: ${error.message || 'Unknown error'}`);
    } finally {
      dismissToast(toastId);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Product Name</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <Label htmlFor="size">Size (Optional)</Label>
        <Input id="size" {...register("size")} />
        {errors.size && <p className="text-red-500 text-sm mt-1">{errors.size.message}</p>}
      </div>
      <div>
        <Label htmlFor="pieces_per_unit">Pieces Per Unit</Label>
        <Input id="pieces_per_unit" type="number" {...register("pieces_per_unit")} />
        {errors.pieces_per_unit && <p className="text-red-500 text-sm mt-1">{errors.pieces_per_unit.message}</p>}
      </div>
      <div>
        <Label htmlFor="current_stock_units">Current Stock (Units)</Label>
        <Input id="current_stock_units" type="number" {...register("current_stock_units")} />
        {errors.current_stock_units && <p className="text-red-500 text-sm mt-1">{errors.current_stock_units.message}</p>}
      </div>
      <div>
        <Label htmlFor="wholesale_price_per_unit">Wholesale Price Per Unit</Label>
        <Input id="wholesale_price_per_unit" type="number" step="0.01" {...register("wholesale_price_per_unit")} />
        {errors.wholesale_price_per_unit && <p className="text-red-500 text-sm mt-1">{errors.wholesale_price_per_unit.message}</p>}
      </div>
      <div>
        <Label htmlFor="sale_price_per_unit">Sale Price Per Unit</Label>
        <Input id="sale_price_per_unit" type="number" step="0.01" {...register("sale_price_per_unit")} />
        {errors.sale_price_per_unit && <p className="text-red-500 text-sm mt-1">{errors.sale_price_per_unit.message}</p>}
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Adding..." : "Add Product"}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default AddProductForm;