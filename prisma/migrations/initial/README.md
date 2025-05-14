# Migración inicial

Esta migración crea la tabla `contribuyentes` que almacenará los datos de los RUCs descargados.

## Tabla: contribuyentes

- **id**: Identificador único
- **ruc**: Número de RUC (único)
- **nombre**: Nombre o razón social del contribuyente
- **digitoVerif**: Dígito verificador
- **rucAnterior**: RUC anterior (opcional)
- **estado**: Estado del contribuyente (ACTIVO, etc.)
- **fechaCreacion**: Fecha de creación en la base de datos
- **fechaUpdate**: Fecha de última actualización
- **fuente**: Fuente de datos (ruc0, ruc1, etc.)

## Índices
- Índice único en `ruc`
- Índice de búsqueda en `ruc` 