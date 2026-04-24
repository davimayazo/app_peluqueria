import re
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile, BusinessConfig


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['id', 'role', 'phone', 'points', 'favorite_barber', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class UserSerializer(serializers.ModelSerializer):
    """Serializer completo del usuario con su perfil."""
    profile = ProfileSerializer()
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'date_joined', 'profile',
        ]
        read_only_fields = ['id', 'username', 'date_joined']

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', None)
        request = self.context.get('request')
        
        # Verificar si el que pide el cambio es admin
        is_admin = False
        if request and hasattr(request.user, 'profile'):
            is_admin = request.user.profile.role == 'admin'
        
        # Actualizar datos de User
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.email = validated_data.get('email', instance.email)
        instance.save()
        
        # Actualizar datos de Profile
        if profile_data:
            profile = instance.profile
            profile.phone = profile_data.get('phone', profile.phone)
            
            # Solo el admin puede cambiar los puntos manualmente
            if is_admin and 'points' in profile_data:
                profile.points = profile_data.get('points', profile.points)
                
            profile.save()
            
        return instance


class RegisterSerializer(serializers.ModelSerializer):
    """
    RF-01: Registro con validación de contraseña.
    Mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número.
    """
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'first_name', 'last_name',
            'password', 'password_confirm',
        ]
        extra_kwargs = {
            'username': {'required': False},
        }

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Ya existe una cuenta con este correo electrónico.')
        return value

    def validate_password(self, value):
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError(
                'La contraseña debe contener al menos una letra mayúscula.'
            )
        if not re.search(r'[a-z]', value):
            raise serializers.ValidationError(
                'La contraseña debe contener al menos una letra minúscula.'
            )
        if not re.search(r'[0-9]', value):
            raise serializers.ValidationError(
                'La contraseña debe contener al menos un número.'
            )
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password_confirm'):
            raise serializers.ValidationError({
                'password_confirm': 'Las contraseñas no coinciden.',
            })
        return attrs

    def create(self, validated_data):
        email = validated_data.get('email', '')
        username = validated_data.get('username')
        
        if not username and email:
            # Generar username a partir del email
            username = email.split('@')[0]
            # Asegurar unicidad
            if User.objects.filter(username=username).exists():
                username = f"{username}_{User.objects.count()}"
        elif not username:
            # Fallback extremo si no hay ni email (no debería pasar por el validador)
            username = f"user_{User.objects.count()}"

        user = User.objects.create_user(
            username=username,
            email=email,
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            password=validated_data['password'],
        )
        
        # El teléfono se puede pasar en el context o validated_data si se añade a Meta fields
        # Como lo añadimos en el frontend pero no estaba en el modelo User, 
        # asumimos que viene en el request data
        request = self.context.get('request')
        phone = ''
        if request and 'phone' in request.data:
            phone = request.data['phone']
            
        Profile.objects.create(user=user, role='cliente', phone=phone)
        return user


class BusinessConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessConfig
        fields = '__all__'
