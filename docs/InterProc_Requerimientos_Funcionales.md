# InterProc — Requerimientos funcionales

_Relevados a partir del diseño del proyecto · 9 de noviembre de 2026 · Gonzalo_

Este documento lista los 50 requerimientos funcionales que se desprenden del diseño de InterProc, agrupados en 8 módulos. Cada requerimiento tiene un identificador (RF-xx) para poder rastrearlo en el desarrollo y las pruebas.

## 1. Acceso y auditoría

| ID | Requerimiento |
|---|---|
| RF-01 | Inicio de sesión con usuario o email y contraseña. |
| RF-02 | No hay registro público: solo un administrador crea las cuentas. |
| RF-03 | Toda acción queda registrada con usuario y fecha/hora. |
| RF-04 | Cierre de sesión. Se muestran el nombre, el rol y el estado "auditada" de quien está conectado. |
| RF-05 | Búsqueda global desde la barra superior (atajo ⌘K). |
| RF-06 | Menú lateral con un contador por módulo: Dashboard, Procedimientos, Clientes, Procesos, Trabajos y Archivo. |

## 2. Dashboard de trabajos (Kanban)

| ID | Requerimiento |
|---|---|
| RF-07 | Tablero con una columna por estado: Borrador, Presupuesto, Planificado, En Ejecución, Terminado, Cancelado, Pausado y En Mantenimiento. |
| RF-08 | Arrastrar una tarjeta a otra columna cambia el estado del trabajo y lo anota en su historial. |
| RF-09 | Cada tarjeta muestra nombre, cliente, tipo, código, pasos hechos sobre el total y % de avance. |
| RF-10 | Indicadores: trabajos activos (y cuántos en ejecución), procedimientos (y cuántos tipos), versiones generadas durante la ejecución y clientes (y cuántos con trabajo abierto). |
| RF-11 | Se puede configurar si el tablero muestra todos los estados o solo los activos. |
| RF-12 | Se puede elegir densidad Cómoda o Compacta. |

## 3. Procedimientos (catálogo)

| ID | Requerimiento |
|---|---|
| RF-13 | Catálogo con una pestaña por tipo/sección más una pestaña "Todas". |
| RF-14 | Un procedimiento tiene: sección, ícono (FontAwesome), título, descripción breve, pasos en texto plano, esquema Mermaid opcional y tiempo estimado. |
| RF-15 | Ver el detalle, con el esquema Mermaid dibujado y un aviso si su sintaxis es inválida. |
| RF-16 | Al editar, si cambian los pasos o el esquema se crea una versión nueva y el motivo es obligatorio. Si solo cambian título, sección, ícono, descripción o tiempo, no se versiona. |
| RF-17 | Archivar un procedimiento lo oculta sin borrar su historial. |
| RF-18 | Historial de versiones con número, fecha, usuario, trabajo de origen, motivo y pasos, marcando cuál es la vigente. |
| RF-19 | Una versión que no es la vigente se puede eliminar físicamente, con una confirmación que advierte que es irreversible. |

## 4. Tipos de procedimiento

| ID | Requerimiento |
|---|---|
| RF-20 | Alta de tipo con nombre (obligatorio) e ícono. |
| RF-21 | Modificar un tipo y ver cuántos procedimientos tiene. |
| RF-22 | Dar de baja un tipo lo archiva. No se permite si tiene procedimientos activos, y se avisa con un mensaje. |

## 5. Clientes

| ID | Requerimiento |
|---|---|
| RF-23 | Listado con búsqueda que muestra nombre, RUT, contacto, email, cantidad de trabajos y cuántos están abiertos. |
| RF-24 | Alta y edición con nombre o razón social (obligatorio y único), RUT, persona de contacto, email, teléfono y dirección. |
| RF-25 | Si se renombra un cliente, el nombre nuevo pasa a sus trabajos. |
| RF-26 | Si se intenta salir con cambios sin guardar, se ofrece "Descartar y salir" o "Guardar y salir". |
| RF-27 | Notas por cliente, generales o vinculadas a un trabajo, con fecha y usuario. Solo se pueden agregar después de guardar el cliente. |
| RF-28 | La ficha lista los trabajos asociados con su estado y avance. |
| RF-29 | Eliminar un cliente lo archiva. No se permite si tiene trabajos abiertos (que no estén Terminados ni Cancelados). |

## 6. Procesos (plantillas)

| ID | Requerimiento |
|---|---|
| RF-30 | Un proceso tiene nombre, ícono, descripción y una lista ordenada de procedimientos. |
| RF-31 | Se arma arrastrando procedimientos desde la librería. Se agregan al final y se reordenan arrastrando. |
| RF-32 | Se muestran la cantidad de procedimientos, el tiempo total estimado (suma de los tiempos) y cuántos trabajos lo usan. |
| RF-33 | Un proceso puede marcarse como facturable. En ese caso lleva moneda (USD o UYU), monto de venta promedio, ganancia esperada y costos. |
| RF-34 | Cada costo tiene descripción, monto y la marca "se traslada al cliente". |
| RF-35 | Se calculan el costo total, el trasladado y el absorbido, el margen (venta menos costos absorbidos) y el presupuesto al cliente (venta más costos trasladados). |
| RF-36 | "Convertir en trabajo" crea un trabajo en Borrador con los procedimientos del proceso. |
| RF-37 | Archivar un proceso. También se avisa si hay cambios sin guardar al salir. |

## 7. Trabajos

| ID | Requerimiento |
|---|---|
| RF-38 | Un trabajo tiene nombre, código (TRB-xxxx), cliente, proceso de origen (o ninguno), tipo (Servicio, Producto o Consultoría), estado y % de avance. |
| RF-39 | Pestaña Armado: un lienzo donde se arrastran o agregan procedimientos desde la librería, se reordenan y se quitan. |
| RF-40 | Elegir un proceso carga sus procedimientos en el lienzo. |
| RF-41 | Desde el armado se puede crear un procedimiento nuevo sin salir del trabajo; queda guardado en el catálogo. |
| RF-42 | Pestaña Ejecución: cada procedimiento muestra sus pasos (versión vigente) y se puede marcar Listo o Pendiente. También se carga el tiempo real y notas u observaciones. |
| RF-43 | Editar los pasos durante la ejecución crea una versión nueva del procedimiento, atribuida al usuario y al trabajo, con motivo obligatorio. La versión anterior se conserva. |
| RF-44 | El avance se calcula como el porcentaje de procedimientos marcados Listo. |
| RF-45 | Pestaña Historial: línea de tiempo con creación, cambios de estado, procedimientos agregados o quitados, versiones nuevas y procedimientos completados. |
| RF-46 | Archivar un trabajo. |
| RF-47 | Se puede configurar si el lienzo muestra la sección o la versión de cada procedimiento. |

## 8. Archivo

| ID | Requerimiento |
|---|---|
| RF-48 | Listado de lo archivado (procedimientos, tipos, procesos, clientes y trabajos) con su tipo y quién lo archivó. |
| RF-49 | Cualquier elemento se puede restaurar. |
| RF-50 | Nada se borra físicamente, salvo las versiones de procedimientos (RF-19), para que todo quede disponible para auditoría. |
