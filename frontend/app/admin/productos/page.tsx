"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '@/lib/api';

export default function AdminProductosPage() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<any>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts
  });

  const mutation = useMutation({
    mutationFn: (data: any) => currentProduct ? updateProduct(currentProduct.id, data) : createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsEditing(false);
      setCurrentProduct(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] })
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
      price: formData.get('price'),
      image_url: formData.get('image_url'),
      stock: formData.get('stock'),
    };
    mutation.mutate(data);
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-background text-textMain flex flex-col">
        <Navbar />
        
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 space-y-8">
          <header className="flex justify-between items-center border-b border-border pb-6">
            <div>
              <h1 className="text-3xl font-display font-bold text-white">Gestión de Productos</h1>
              <p className="text-textMuted">Administra el inventario y precios de la tienda</p>
            </div>
            <Button onClick={() => { setIsEditing(true); setCurrentProduct(null); }}>
              Añadir Producto
            </Button>
          </header>

          {isEditing && (
            <Card className="bg-surfaceLayer border-primary/30">
              <CardHeader>
                <CardTitle>{currentProduct ? 'Editar Producto' : 'Nuevo Producto'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-textMuted">Nombre del Producto</label>
                      <input name="name" defaultValue={currentProduct?.name} required className="w-full bg-surface border border-border rounded-lg px-4 py-2 text-white" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-textMuted">Precio (€)</label>
                      <input name="price" type="number" step="0.01" defaultValue={currentProduct?.price} required className="w-full bg-surface border border-border rounded-lg px-4 py-2 text-white" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-textMuted">Descripción</label>
                    <textarea name="description" defaultValue={currentProduct?.description} className="w-full bg-surface border border-border rounded-lg px-4 py-2 text-white h-20" />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-textMuted">URL de Imagen</label>
                      <input name="image_url" defaultValue={currentProduct?.image_url} className="w-full bg-surface border border-border rounded-lg px-4 py-2 text-white" placeholder="https://..." />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-textMuted">Stock Disponible</label>
                      <input name="stock" type="number" defaultValue={currentProduct?.stock || 0} className="w-full bg-surface border border-border rounded-lg px-4 py-2 text-white" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="glass" onClick={() => setIsEditing(false)}>Cancelar</Button>
                    <Button type="submit" disabled={mutation.isPending}>
                      {mutation.isPending ? 'Guardando...' : 'Guardar Producto'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {products?.map((product: any) => (
              <Card key={product.id} className="bg-surface border-border/40 overflow-hidden group hover:border-primary/30 transition-all">
                <div className="aspect-video bg-surfaceLayer relative overflow-hidden">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-textMuted italic">Sin imagen</div>
                  )}
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-primary font-bold">
                    {product.price} €
                  </div>
                </div>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-white">{product.name}</h3>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${product.stock > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      Stock: {product.stock}
                    </span>
                  </div>
                  <p className="text-sm text-textMuted line-clamp-2 mb-6 h-10">{product.description || 'Sin descripción'}</p>
                  <div className="flex justify-end gap-3">
                    <button onClick={() => { setCurrentProduct(product); setIsEditing(true); }} className="text-xs font-bold text-primary hover:underline uppercase tracking-widest">Editar</button>
                    <button onClick={() => confirm('¿Eliminar producto?') && deleteMutation.mutate(product.id)} className="text-xs font-bold text-red-500/70 hover:text-red-500 uppercase tracking-widest">Eliminar</button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
