#!/bin/bash

# Compilar proyecto Angular
echo "Compilando proyecto Angular..."
ng build

# Verificar si la compilación fue exitosa
if [ $? -eq 0 ]; then
    echo "Compilación exitosa. Iniciando construcción de Docker..."
    
    # Construir y subir imagen Docker
    docker buildx build --platform linux/amd64 \
      -t ehitelrc/harmony_web:latest \
      --no-cache \
      --push .
else
    echo "Error en la compilación de Angular. Abortando."
    exit 1
fi
