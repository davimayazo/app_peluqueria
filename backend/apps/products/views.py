from rest_framework import generics, permissions
from .models import Product
from .serializers import ProductSerializer

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
        except Exception as e:
            print("DB CREATE ERROR:", e)
            
        return Product.objects.filter(is_active=True)
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()] # Admin check recommended

class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]
