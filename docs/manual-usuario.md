# Manual de usuario — Fishy · Panel de moderación

**Versión:** 1.0 · **Fecha:** 2026-10-20

**Equipo 3**

- Luis Enrique Díaz Benítez — A01668493
- Enrique Cruz Salinas — A01668489
- Alani Daniel García Maya — A01277308
- Camila Quintanilla Cabrera — A01662397 

## 1. ¿Qué es Fishy?

Fishy es una plataforma donde las personas reportan fraudes y estafas digitales
que les llegan: SMS falsos, correos de phishing, mensajes de WhatsApp, páginas
falsas. Este **panel de moderación** es donde un administrador revisa cada
reporte antes de publicarlo, para que la comunidad solo vea información
confiable.

## 2. Para quién es este manual

Para el **administrador** que modera los reportes desde el navegador. No necesita
saber programar.

Los usuarios que reportan fraudes usan la **app de iOS**, no este panel. [Si
agregan el manual de la app, indicar aquí dónde está.]

## 3. Antes de empezar

- Navegador: Chrome, Firefox, Safari o Edge actualizado
- La dirección del panel: [http://localhost:5173] o [http://IP-de-la-red:5173]
- Una cuenta de **administrador**. Si no tienes, ve a la sección 4.1

## 4. Entrar al panel

### 4.1 Obtener una cuenta de administrador

El panel no tiene página de registro. La cuenta de administrador la crea el
equipo técnico: te registra como usuario y le asigna el rol de administrador.
Después te manda tu correo y tu contraseña.

Una cuenta de usuario normal (la que se crea en la app) **no puede entrar** al
panel.

### 4.2 Iniciar sesión

1. Abre la dirección del panel
2. Escribe tu correo y tu contraseña
3. Haz clic en **Entrar a la plataforma**

![Pantalla de inicio de sesión](img/login.png)

Si el correo o la contraseña están mal, verás el mensaje
*"Credenciales inválidas"*. Revísalos e inténtalo de nuevo.

Por seguridad, después de **5 intentos fallidos en un minuto** el panel deja de
aceptar intentos por un momento. Espera un minuto antes de volver a probar.

## 5. Tareas

El menú de la izquierda tiene cinco secciones: **Panel**, **Por revisar**,
**Reportes**, **Usuarios** y **Lecturas**. Abajo están tu correo y el botón para
cerrar sesión. El botón junto al logo de Fishy reduce o expande el menú.

![Menú lateral](img/menu-lateral.png)

### 5.1 Ver el resumen (Panel)

Es la primera pantalla al entrar.

![Panel principal](img/panel.png)

- **Aviso de pendientes**: si hay reportes por moderar, dice cuántos. Haz clic en
  **Revisar ahora** para ir directo a ellos.
- **Indicadores**: reportes totales, por revisar, aprobados, rechazados y de
  alto riesgo.
- **Reportes recibidos por día**: cuántos llegaron en los últimos 14 días.
- **Por categoría** y **Por nivel de riesgo**: cómo se reparten los reportes.
- **Reportes recientes**: los últimos cinco, con su estado.

### 5.2 Moderar un reporte (Por revisar)

Aquí están los reportes que esperan tu decisión, primero los que más usuarios
confirmaron con "me pasó igual".

1. Haz clic en **Por revisar** en el menú
2. Haz clic en el reporte que quieres revisar

![Lista de reportes pendientes](img/por-revisar.png)

3. Lee las **evidencias**: el enlace, teléfono o correo del fraude, la
   descripción y, si tiene, la captura que subió el usuario

![Detalle de un reporte pendiente](img/detalle-pendiente.png)

4. Elige el **nivel de riesgo**: **Bajo**, **Medio** o **Alto**
5. Haz clic en **Aprobar y publicar**, o en **Rechazar** si el reporte no es un
   fraude real, está duplicado o no tiene sentido

![Nivel de riesgo elegido y botones de decisión](img/moderar.png)

El reporte desaparece de la lista. Si lo aprobaste, ya lo ven todos los
usuarios en la app.

**La decisión es definitiva**: un reporte aprobado o rechazado ya no se puede
cambiar.

Los enlaces de las evidencias se muestran "desactivados" a propósito
(por ejemplo `hxxps://pagina-falsa[.]com`) para que no los abras por accidente.
No los copies a tu navegador.

Cuando no hay pendientes, la pantalla dice *"Todo al día: no hay reportes
pendientes."*

### 5.3 Consultar todos los reportes (Reportes)

1. Haz clic en **Reportes** en el menú
2. Usa los filtros para encontrar lo que buscas:
   - **Buscador**: por título, autor, dominio o teléfono
   - **Estado**: pendiente, aprobado o rechazado
   - **Riesgo**: Bajo, Medio, Alto o Sin clasificar
   - **Categoría**: SMS, URL, Email, etc.

![Tabla de reportes con filtros](img/reportes.png)

3. Haz clic en un reporte para ver su detalle

En el detalle, además de las evidencias, ves la **interacción**: a cuántas
personas les pasó lo mismo ("me pasó igual") y los **comentarios** de la
comunidad, con su autor y fecha.

![Detalle con "me pasó igual" y comentarios](img/detalle-interaccion.png)

Para quitar los filtros, haz clic en **Limpiar filtros**.

### 5.4 Administrar usuarios (Usuarios)

1. Haz clic en **Usuarios** en el menú
2. Escribe en el buscador un nombre o correo para encontrar a alguien

![Lista de usuarios](img/usuarios.png)

La lista muestra 10 usuarios por página; usa **Anterior** y **Siguiente** para
moverte. Tu propia cuenta no aparece en la lista.

### 5.5 Eliminar un usuario

1. En la lista, haz clic en el ícono de **basura** junto al usuario
2. Lee el aviso con el nombre y correo del usuario
3. **Mantén presionado** el botón **Mantén para eliminar** hasta que se llene
   (unos 2 segundos)

![Diálogo para eliminar usuario](img/eliminar-usuario.png)

Esta acción **no se puede deshacer**. Los reportes y comentarios de ese usuario
se conservan, pero aparecen como *"Usuario eliminado"*.

Si cambias de opinión, haz clic en **Cancelar** o suelta el botón antes de que
se llene.

### 5.6 Agregar una lectura (Lecturas)

Las lecturas son textos educativos sobre fraudes que los usuarios leen en la app.

1. Haz clic en **Lecturas** en el menú

![Lista de lecturas](img/lecturas.png)

2. Haz clic en **Nueva lectura**
3. Escribe el **título** y el **contenido**
4. Revisa el **orden**: es la posición en la que aparece en la app. Ya viene el
   siguiente número disponible y no puede repetirse
5. Haz clic en **Guardar lectura**

`[captura: formulario de nueva lectura]`

La lectura aparece en la tabla, ordenada por su número.

### 5.7 Cerrar sesión

Haz clic en el ícono de **salir**, abajo a la izquierda junto a tu correo.
Regresas a la pantalla de inicio de sesión.

![Botón de cerrar sesión](img/cerrar-sesion.png)

## 6. Problemas frecuentes

| Qué ves | Qué significa | Qué hacer |
|---|---|---|
| *"Credenciales inválidas"* al entrar | El correo o la contraseña no coinciden | Revísalos. Si olvidaste la contraseña, pide al equipo técnico que te la restablezca |
| *"Esta cuenta no tiene permisos de administrador."* | Tu cuenta es de usuario, no de administrador | Pide al equipo técnico que te asigne el rol |
| *"ThrottlerException: Too Many Requests"* al entrar | Superaste 5 intentos en un minuto | Espera un minuto y vuelve a intentar |
| *"Tu sesión expiró. Vuelve a iniciar sesión."* o te regresa a la pantalla de entrar | Tu sesión venció por seguridad | Vuelve a entrar; nada se pierde |
| *"No se pudo conectar con el servidor."* | La API no responde o la dirección configurada es incorrecta | Espera un momento y recarga. Si sigue, avisa al equipo técnico |
| *"Elige un nivel de riesgo antes de decidir."* | Intentaste aprobar o rechazar sin riesgo | Elige Bajo, Medio o Alto y vuelve a intentar |
| *"Este reporte ya fue moderado."* | Otro administrador ya tomó la decisión | No hace falta hacer nada |
| No se guarda una lectura | Falta el título o contenido, o el orden ya existe | Revisa el mensaje en rojo y cambia el número de orden |
| Una gráfica o lista sale vacía | Todavía no hay reportes de ese tipo | Es normal; se llena conforme llegan reportes |

## 7. Glosario

- **Reporte**: aviso de un fraude que envía un usuario desde la app. Tiene título,
  categorías y evidencias.
- **Evidencia**: el enlace, teléfono o correo del fraude, su descripción y, a
  veces, una captura de pantalla.
- **Estado**: en qué paso está el reporte. *Pendiente* (esperando moderación),
  *Aprobado* (publicado) o *Rechazado*.
- **Nivel de riesgo**: qué tan peligroso es el fraude: *Bajo*, *Medio* o *Alto*.
  Lo asigna el administrador al moderar.
- **Categoría**: tipo de fraude: SMS, URL, Email, Otros.
- **"Me pasó igual"**: usuarios que confirman que recibieron el mismo fraude.
- **Lectura**: texto educativo sobre cómo identificar y evitar fraudes.
- **Sesión**: el tiempo en que el panel te reconoce después de entrar. Vence sola
  por seguridad.

## 8. Soporte

[Correo o medio de contacto del equipo.]
