from django.urls import path
from .views import ProductListView, ProductDetailView, BuyProductView, ProductSaleListView

urlpatterns = [
    path('', ProductListView.as_view(), name='product_list'),
    path('sales/', ProductSaleListView.as_view(), name='product_sales'),
    path('<int:pk>/', ProductDetailView.as_view(), name='product_detail'),
    path('<int:pk>/buy/', BuyProductView.as_view(), name='product_buy'),
]
