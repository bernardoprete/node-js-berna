# Bases de datos

Una base de datos es una coleccion organizada de datos, que se almacenan eletrónicamente en un sistema informático.

### ¿Para que se utilizan?

- Almacenar grandes volumenes de datos: desde información de los usuarios, hasta la gestión de reportes de una ecommerce.

- Organizar la información: los datos no están desordenados, tienen una estructura lógica que facilita su búsqueda y manipulación.

- Acceso rapido y eficiente: Permite acceder, actualizar, eliminar y crear datos de forma ágil, incluso si son millones de registro.

- Seguridad: Permiten establecer un sistema de autenticación y autorización.

- Persistencia: Los datos permanencen almacenados por más que la aplicación se cierre o se deje utilizar.

<br>

### Tipos de bases de datos: Relacionales Vs. No relacionales

---

<br>

**Bases de datos relacionales (SQL)**: Son las más tradicionales, se basan en el modelo relacional, donde los datos se organizan en tablas. Cada tabla posee filas y columnas, y las relaciones entre diferentes tablas se establecen a través de 'claves'. Son ideales para datos estructurados donde la integridad y las relaciones son cruciales. (sistemas bancarios, gestión de inventarios)

#### Conceptos claves:

    - Tabla: Es la unidad fundamental de almacenamiento en una BD relacional, se compone por filas y columnas. Cada tabla almacena información sobre una entidad especifica. (ej: clientes, productos, venta, pedido)

    - Fila (Registro / tupla): Representa una unica instancia de los datos dentro de la tabla (ej: un cliente y su información. Nombre, email, rol,password, etc..)

    - Columna (Campo / atributo): Una propiedad especifica dentro de la tabla. por ej: id, email, password,etc..

    - Claves Primarias (Primary Key - PK): Es una columna o un conjunto de ellas (clave compuesta), contiene valores unicos para cada fila, la idea es representar/identificar de forma unica dada registro.

        - Carácteristicas:  
            - Deben ser valores únicos (no duplicados)
            - No pueden ser valores nulos (vacíos).
            - Solo se puede tener una clave primaria.
            - Ej: id_cliente o idCliente.
    
    - Claves foraneas (Foreign Key - FK): Es una columna o conjuntos de ellas (dentro de la tabla 'hija') que hace referencia a la Clave Primaria de otra tabla (la tabla padre). Establece una relacion entre ambas, asegurando la integridad referencial de los datos y nos permite evitar redundancias.

    Ej: Tenemos una tabla Pedidos y una tabla Clientes, queremos asociar un pedido con un cliente, podemos relacionarlas a través de una clave foranea en la tabla padre (Pedidos), creamos un campo llamado idCliente y lo definimos como clave foranea que va a hacer referencia a la tabla Clientes.

    Entonces, en el Pedido 332, vamos a relacionar el Cliente 55 (PK de la tabla 'padre'). 


<br>

**Bases de datos NO Relacionales (NoSQL):**
Nos permiten cubrir necesidades de escalabilidad y flexibilidad, se utiliza mucho en aplicaciones modernas, especialmente en aquellas que manejan grandes cantidad de datos no estructurados o semi-estructurados. No siguen un modelo de tabla, fila y columna tradicional, sino que se denominan, coleccion, documentos, atributos.
Datos / Documentos que no están sujetas a un esquema rigido, es decir, que cada uno de ellos pueden contener diferentes campos.

Ej: producto que tenga diferentes caracteristicas, una remera que posea diferentes colores, talles, pero tambien puedo tener otro producto que no posea esas caracteristicas.


<br>

## SQL: Structured Query Lenguage / Lenguaje de consulta estructurada.

Es el **lenguaje estandar** que se utiliza para gestionar y manipular bases de datos Relacionales. Permite consultar, insertar, actualizar y eliminar datos. Asi como definir la estructura de la base datos, controlar el acceso y permisos de usuarios, en resumen, adiministrar completamente una base datos.

<br>

## Sistemas de Gestión de Bases de Datos Relacionales (RDBMS)

Los RDBMS (Relational database Management Systems): son el software que nos permite a través de SQL, gestionar, mantener y acceder a las bases de datos, usando SQL como lenguaje para comunicarnos. Son el sistema intermediario entre nosotros (app) y los datos almacenados.

    Ejemplos:

    - MySQL: Uno de los más conocidos, ampliamente utilizando en lo que es aplicaciones web. Generalmente se utiliza por ser rapido, y facil de usar. Se utiliza en apps de escala 'media'.

    - PostgreSQL: Destaca por su robustez, cumplimiento de estandares, y potencia las caracteresticas que ya pose MySQL. Es un sistema de gestiñon de bases de datos relacionales orientado a objetos, nos brinda una mayor flexibilidad y un conjunto de herramientas más amplias. Principalmente en la variedad de tipos de datos que puede almacenar.

    - SQL Server: Es muy similar a MySQL, se utiliza principalmente en entornos 'empresariales' que utilizan principalmentes tecnologías de Microsoft. 


### Interfaz gráfica de usuarios (GUIs): Interfaces que nos permiten gestionar de manera visual nuestra BD.

    - Phpmyadmin, Workbench, HeideSQL, pgAdmin..


## Conceptos teóricos fundamentales (SQL)


### Tipos de comandos SQL
    
    - DDL (Data Definition Language - Lenguaje de definición de datos): Se utilizan para definir y modificar la estructura de la base datos y sus objetos (tablas, indices, vistas, etc..). Ej: CREATE TABLE, ALTER TABLER, DROP TABLE.

    - DML (Data Manipulation Language - Lenguaje de Manipulación de datos): Se utilizan para manipular los datos dentro de las tablas de la BD. Ej: INSERT, SELECT, UPDATE, DELETE.


### Diagrama Entidad-Relación (E-R)

El **modelo Entidad-Relacion** es una herramienta que se utiliza para diseñar la BD a nivel lógico. Nos permite representar la estructura de los datos y sus relaciones de manera gráfica. Nos ayuda a visualizar y planificar cómo organizar las tablas y sus relaciones, antes de llegar al diseño final (fisico).

    - Entidades: Son objetos o conceptos del mundo real sobre los cuales queremos almacenar información (clientes, productos, ventas, etc). Se representan con rectángulos.

    - Atributos: Las propiedades/caracteristicas que descrien a una entidad (nombre, apellido, email,etc.). Se representan con ovalos conectados a las entidades.

    - Cardinalidad: Indica el tipo de relación entre tablas, define el numero de instancias que una entidad relaciona con otra. 
        - Uno a uno: Indica que una entidad está relacionada con otra una unica vez. (1:1)
        - De uno a muchos: Significa que una instancia de una entidad está relacionada muchas veces a otra entidad. (1:N)
        - Muchos a muchos: Indica que por ej, muchas peliculas puedes estar alquiladas, y que muchos alquileres pueden alquilar una pelicula. (N:M)

    - Relaciones: Describen como se asocian/relacionan las entidades entre sí. Se representan con rombos y se conectan las entidad que se relacionan.

    - Clave Primaria (PK): Uno o más atributos que identificar de forma única cada registro de la tabla. Se representa subrayando el nombre del atributo.


### Modelo Relacional:

A diferencia del DER conceptual el cual utiliza ovalos y rombos para atributos y relaciones correspondientemente, este diagrama/modelo utiliza la información para asemejarse más a las tablas reales (fisicas) de una BD. Nos va a servir para representar directamente las tablas, sus columnas (y tipo de datos), y la relación entre ellas, también cardinalidad para especificar la depedencia de datos y como se mantiene la intregridad referencial. Además sirve como 'blueprint' para la creación real de la BD en un sistema de gestión de BD. 

    - Entidades (tablas): Siguen siendo objetos del mundo real, pero se preresentan como rectángulos que se dividen para simular la tabla y sus columnas.

    - La parte superior del rectangulo lo vamos a utilizar para nombrar la entidad .

    - Los datos subsiguientes representan los atributos de la entidad.

    - En una segunda columna podríamos especificar los tipos de datos.
        - Varchar: Una colección de carácteres (texto), generalmente la cantidad de caracteres se especifican entre parentesís.
        - INT: Integer - entero
        - Decimal: valores con decimales.
        - Bool
        - Text: un texto mucho más amplio de lo que permite varchar.
        - etc..
    
    - Las claves primarias, se definen dentro de los primeros atributos.

    - Las claves foraneas, al final de los atributos de esa entidad, podemos especificar entre parentesis que es una (FK)

    - Relaciones vinculando directamente la entidades con flechas.

    - Cardinalidad se especifica con un tipo de flecha especifico 'pata de gallo', este ultimo significa la parte de 'muchos'.


### Tarea 12/09.

    -  En base al findOne, desarrollar un método findAllBySearch() -> para poder filtrar uno o más usuarios (devolver un listado.).
    - Validar que para ciertas acciones el usuario este logueado y sea ADMIN. tener en en cuenta que el campo para verificar rol es numerico y se llama idRol.