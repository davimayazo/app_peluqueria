from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Product, ProductSale
from .serializers import ProductSerializer, ProductSaleSerializer
from apps.users.models import BusinessConfig

class ProductListView(generics.ListCreateAPIView):
    serializer_class = ProductSerializer
    
    def get_queryset(self):
        # Auto-create table hack for SQLite environment
        from django.db import connection
        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS products_product (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name VARCHAR(100) NOT NULL,
                        description TEXT,
                        price DECIMAL(8,2) NOT NULL,
                        image_url VARCHAR(200),
                        stock INTEGER DEFAULT 0,
                        is_active BOOL DEFAULT 1,
                        created_at DATETIME,
                        updated_at DATETIME
                    )
                """)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS products_productsale (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        product_id INTEGER NOT NULL,
                        user_id INTEGER,
                        quantity INTEGER DEFAULT 1,
                        price_at_sale DECIMAL(8,2) NOT NULL,
                        discount_applied DECIMAL(8,2) DEFAULT 0,
                        created_at DATETIME,
                        FOREIGN KEY (product_id) REFERENCES products_product (id)
                    )
                """)
        except Exception as e:
            print("DB CREATE ERROR:", e)
            
        return Product.objects.filter(is_active=True)
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]

class BuyProductView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        product = get_object_or_404(Product, pk=pk)
        profile = request.user.profile
        
        try:
            config = BusinessConfig.objects.get(id=1)
        except BusinessConfig.DoesNotExist:
            config = BusinessConfig.objects.create(id=1)
            
        if product.stock <= 0:
            return Response({"error": "Producto agotado"}, status=status.HTTP_400_BAD_REQUEST)

        # Lógica de puntos
        redemption_value = float(config.point_redemption_value or 0.01)
        points_needed_for_full_price = float(product.price) / redemption_value
        
        discount_applied = 0
        if profile.points >= points_needed_for_full_price:
            profile.points -= int(points_needed_for_full_price)
            discount_applied = float(product.price)
        else:
            discount_applied = float(profile.points) * redemption_value
            profile.points = 0
            
        profile.save()
        product.stock -= 1
        product.save()

        # REGISTRAR VENTA
        ProductSale.objects.create(
            product=product,
            user=request.user,
            price_at_sale=product.price,
            discount_applied=discount_applied
        )
        
        return Response({
            "message": "Compra realizada con éxito",
            "discount_applied": discount_applied,
            "remaining_points": profile.points,
            "new_stock": product.stock
        })

class ProductSaleListView(generics.ListAPIView):
    queryset = ProductSale.objects.all()
    serializer_class = ProductSaleSerializer
    permission_classes = [permissions.IsAuthenticated]
