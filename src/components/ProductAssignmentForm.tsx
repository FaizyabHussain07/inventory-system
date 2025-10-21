"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '../integrations/supabase/client';
import { useSession } from './SessionContextProvider';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { DialogFooter } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { showError, showSuccess, showLoading, dismissToast } from '../utils/toast';

const productAssignmentSchema = z.object({
  retailer_id: z.string().min(1, "Retailer is required"),
  product_id: z.string().min(1, "Product is required"),
  retailer_sale_price_per_unit: z.preprocess(
    (val) => Number(val),
    z.number().positive("Sale price must be positive")
  ),
  retailer_current_stock_units: z.preprocess(
    (val) => Number(val),
    z.number().int().min(0, "Current stock units cannot be negative")
  ),
});

type ProductAssignmentFormValues = z.infer<typeof productAssignmentSchema>;

interface Product {
  id: string;
  name: string;
}

interface Retailer {
  id: string;
  name: string;
}

interface ProductAssignment {
  product_id: string;
  retailer_id: string;
  retailer_sale_price_per_unit: number;
  retailer_current_stock_units: number;
}

interface ProductAssignmentFormProps {
  initialAssignment?: ProductAssignment; // Optional prop for editing
  onAssignmentSaved: () => void;
  onClose: () => void;
}

const ProductAssignmentForm = ({ initialAssignment, onAssignmentSaved, onClose }: ProductAssignmentFormProps) => {
  const { session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<ProductAssignmentFormValues>({
    resolver: zodResolver(productAssignmentSchema),
    defaultValues: initialAssignment || {
      retailer_id: '',
      product_id: '',
      retailer_sale_price_per_unit: 0,
      retailer_current_stock_units: 0,
    },
  });

  const selectedRetailerId = watch('retailer_id');
  const selectedProductId = watch('product_id');

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.id) return;

      setLoadingData(true);
      const adminId = session.user.id;

      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name')
        .eq('admin_id', adminId);

      if (productsError) {
        console.error('Error fetching products:', productsError);
        showError('Failed to load products.');
      } else {
        setProducts(productsData || []);
      }

      // Fetch retailers
      const { data: retailersData, error: retailersError } = await supabase
        .from('retailers')
        .select('id, name')
        .eq('admin_id', adminId);

      if (retailersError) {
        console.error('Error fetching retailers:', retailersError);
        showError('Failed to load retailers.');
      } else {
        setRetailers(retailersData || []);
      }

      setLoadingData(false);
    };

    fetchData();
  }, [session]);

  useEffect(() => {
    // Reset form with initialAssignment data when it changes (for editing)
    reset(initialAssignment || {
      retailer_id: '',
      product_id: '',
      retailer_sale_price_per_unit: 0,
      retailer_current_stock_units: 0,
    });
  }, [initialAssignment, reset]);

  const onSubmit = async (values: ProductAssignmentFormValues) => {
    if (!session?.user?.id) {
      showError("You must be logged in to manage product assignments.");
      return;
    }

    const toastId = showLoading(initialAssignment ? "Updating assignment..." : "Assigning product...");

    try {
      let error = null;
      if (initialAssignment) {
        // Update existing assignment
        const { error: updateError } = await supabase
          .from('product_retailers')
          .update({
            retailer_sale_price_per_unit: values.retailer_sale_price_per_unit,
            retailer_current_stock_units: values.retailer_current_stock_units,
            retailer_last_updated_at: new Date().toISOString(),
          })
          .eq('product_id', initialAssignment.product_id)
          .eq('retailer_id', initialAssignment.retailer_id)
          .eq('assigned_by_admin_id', session.user.id);
        error = updateError;
      } else {
        // Insert new assignment
        const { error: insertError } = await supabase
          .from('product_retailers')
          .insert({
            product_id: values.product_id,
            retailer_id: values.retailer_id,
            assigned_by_admin_id: session.user.id,
            retailer_sale_price_per_unit: values.retailer_sale_price_per_unit,
            retailer_current_stock_units: values.retailer_current_stock_units,
          });
        error = insertError;
      }

      if (error) {
        throw error;
      }

      showSuccess(initialAssignment ? "Assignment updated successfully!" : "Product assigned successfully!");
      reset();
      onAssignmentSaved();
      onClose();
    } catch (error: any) {
      console.error("Error saving product assignment:", error);
      showError(`Failed to save assignment: ${error.message || 'Unknown error'}`);
    } finally {
      dismissToast(toastId);
    }
  };

  if (loadingData) {
    return <div>Loading data...</div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="retailer_id">Retailer</Label>
        <Select
          onValueChange={(value) => setValue('retailer_id', value, { shouldValidate: true })}
          value={selectedRetailerId}
          disabled={!!initialAssignment} // Disable selection if editing
        >
          <SelectTrigger id="retailer_id">
            <SelectValue placeholder="Select a retailer" />
          </SelectTrigger>
          <SelectContent>
            {retailers.map((retailer) => (
              <SelectItem key={retailer.id} value={retailer.id}>
                {retailer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.retailer_id && <p className="text-red-500 text-sm mt-1">{errors.retailer_id.message}</p>}
      </div>

      <div>
        <Label htmlFor="product_id">Product</Label>
        <Select
          onValueChange={(value) => setValue('product_id', value, { shouldValidate: true })}
          value={selectedProductId}
          disabled={!!initialAssignment} // Disable selection if editing
        >
          <SelectTrigger id="product_id">
            <SelectValue placeholder="Select a product" />
          </SelectTrigger>
          <SelectContent>
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.product_id && <p className="text-red-500 text-sm mt-1">{errors.product_id.message}</p>}
      </div>

      <div>
        <Label htmlFor="retailer_sale_price_per_unit">Retailer Sale Price Per Unit</Label>
        <Input
          id="retailer_sale_price_per_unit"
          type="number"
          step="0.01"
          {...register("retailer_sale_price_per_unit")}
        />
        {errors.retailer_sale_price_per_unit && <p className="text-red-500 text-sm mt-1">{errors.retailer_sale_price_per_unit.message}</p>}
      </div>
      <div>
        <Label htmlFor="retailer_current_stock_units">Retailer Current Stock (Units)</Label>
        <Input
          id="retailer_current_stock_units"
          type="number"
          {...register("retailer_current_stock_units")}
        />
        {errors.retailer_current_stock_units && <p className="text-red-500 text-sm mt-1">{errors.retailer_current_stock_units.message}</p>}
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (initialAssignment ? "Updating..." : "Assigning...") : (initialAssignment ? "Save Changes" : "Assign Product")}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default ProductAssignmentForm;