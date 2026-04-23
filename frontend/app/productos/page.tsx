"use client";
import Link from 'next/link';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { fetchProducts, fetchProfile, fetchBusinessConfig, buyProduct } from '@/lib/api';
import { useState } from 'react';

export default function ProductosCatalogPage() {
  const queryClient = useQueryClient();
  const [purchaseMessage, setPurchaseMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts
  });

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile
  });

  const { data: config } = useQuery({
    queryKey: ['business_config'],
    queryFn: fetchBusinessConfig
  });

  const buyMutation = useMutation({
    mutationFn: buyProduct,
    onSuccess: (data) => {
      setPurchaseMessage({ text: '¡Gracias por tu compra! El pedido ha sido procesado.', type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setTimeout(() => setPurchaseMessage(null), 5000);
    },
    onError: (error: any) => {
      setPurchaseMessage({ text: error.message || 'Error al procesar la compra', type: 'error' });
      setTimeout(() => setPurchaseMessage(null), 5000);
    }
  });

  const userPoints = profile?.profile?.points || 0;
  const redemptionValue = config?.point_redemption_value || 0.01;

  const calculateDiscount = (points: number) => {
    return (points * redemptionValue).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-12">
        <header className="mb-12 relative">
          <h1 className="text-4xl font-display font-bold text-white mb-4">Nuestra Tienda</h1>
          <p className="text-xl text-textMuted">Productos premium para el cuidado de tu estilo</p>
          
          {purchaseMessage && (
            <div className={`fixed top-24 right-8 z-50 p-4 rounded-xl border animate-in slide-in-from-right duration-300 ${
              purchaseMessage.type === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-red-500/10 border-red-500/50 text-red-400'
            }`}>
              {purchaseMessage.text}
            </div>
          )}

          {profile && (
            <div className="mt-8 p-6 bg-gradient-to-r from-primary/20 to-transparent border-l-4 border-primary rounded-r-2xl inline-flex items-center gap-6">
              <div>
                <p className="text-sm font-bold text-primary uppercase tracking-widest">Tus Puntos</p>
                <p className="text-3xl font-display font-bold text-white">{userPoints}</p>
              </div>
              <div className="h-10 w-px bg-primary/20"></div>
              <div>
                <p className="text-sm font-bold text-primary uppercase tracking-widest">Descuento Disponible</p>
                <p className="text-3xl font-display font-bold text-white">{calculateDiscount(userPoints)} €</p>
              </div>
            </div>
          )}
        </header>

        {productsLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products?.map((product: any) => {
              const discount = parseFloat(calculateDiscount(userPoints));
              const finalPrice = Math.max(0, product.price - discount).toFixed(2);
              
              return (
                <Card key={product.id} className="bg-surface border-border/40 overflow-hidden flex flex-col group hover:border-primary/50 transition-all">
                  <div className="aspect-square bg-surfaceLayer relative overflow-hidden">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-textMuted italic">Sin imagen</div>
                    )}
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white font-bold text-sm">
                      {product.price} €
                    </div>
                  </div>
                  <CardContent className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-white mb-2">{product.name}</h3>
                    <p className="text-sm text-textMuted mb-6 line-clamp-3">{product.description || 'Producto de alta calidad seleccionado por nuestros expertos.'}</p>
                    
                    <div className="mt-auto pt-6 border-t border-border/20">
                      <div className="space-y-3">
                        {userPoints > 0 && (
                          <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                            <span className="text-textMuted">Descuento por puntos:</span>
                            <span className="text-primary">-{calculateDiscount(userPoints)} €</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center">
                          <div className="flex flex-col">
                            {userPoints > 0 && (
                              <span className="text-xs text-textMuted line-through">{product.price} €</span>
                            )}
                            <span className="text-2xl font-display font-bold text-white">
                              {userPoints > 0 ? finalPrice : product.price} €
                            </span>
                          </div>
                          
                          {profile ? (
                            <Button 
                              size="sm" 
                              onClick={() => buyMutation.mutate(product.id)}
                              disabled={buyMutation.isPending || product.stock <= 0}
                            >
                              {buyMutation.isPending ? 'Procesando...' : (product.stock > 0 ? 'Comprar' : 'Agotado')}
                            </Button>
                          ) : (
                            <Link href="/login?redirect=/productos">
                              <Button size="sm" variant="glass">Login para Comprar</Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
