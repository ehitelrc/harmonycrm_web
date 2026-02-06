#!/bin/bash

# Solicitar mensaje del commit
echo "Ingrese el mensaje del commit:"
read commit_message

if [ -z "$commit_message" ]; then
    echo "El mensaje del commit no puede estar vacío."
    exit 1
fi

# Agregar cambios
git add .

# Hacer commit
git commit -m "$commit_message"

# Hacer push
echo "Subiendo cambios al repositorio..."
git push

echo "¡Listo!"
