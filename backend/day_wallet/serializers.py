from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import AppUser


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = AppUser
        fields = ("password", "email")

    def create(self, validated_data) -> AppUser:
        user = AppUser.objects.create_user(**validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(**data)
        if not user:
            raise serializers.ValidationError("Invalid credentials")

        return {"user": user}
