/*

    Lo que fuimos viendo hasta ahora: http.
    - Manejo manual de rutas (req y res)
    - Analisis manual con url.parse() para identificar la ruta y el metodo.
    - Condicionales para configuración manual del enrutamiento.
    - Construcción manuald e las respuestas (cabeceras, cuerpo, estado)
    - Dificultades para la manipulacion del body, necesitamos procesar los chunks.

    En este punto es donde Express nos facilita la creación de aplicaciones web y APIs Rest.

    ## EXPRESS: es un framework que nos brindan herramientas para la automatización de funciones basicas como enrutamiento, procesamiento del cuerpo de la petición y de la respuesta, además nos permite levantar un server. Es minimalista y flexible, ya que nos permite acoplar a su funcionamiento otras librerias o nuestro propio código. Nos permite simplificar el manejo de peticiones HTTP, el enrutamiento, la gestion de middleware y la construcción de respuestas.
    
    Manejo de rutas en Express: este framework nos proporciona métodos para cada verbo HTTP: app.get(), app.post(), app.put(), app.delete(), app.patch().

    Para programar una ruta, usamos la siguiente instruccion:

    app.method(ruta,handler)

    * Codigo muchas conciso y legible. 
    * Manejo de rutas mucho más sencillo, en lugar de tener que utilizar una estructura if.

    - Envio de la respuesta: res.send();
        Express infiere de forma automatica el Content-Type y también el res.end(), una vez que llamamos a este metodo (send) la respuesta se considera completada. 
        Los diferentes tipos de datos serán inferidos automaticamente. EJ: si le pasamos un objeto de javascript, el content-type sera 'application/json', si le paso solo texto será 'text/plain', html también se infiere, y buffers.


    ## ANALIZANDO REQ y RES en EXPRESS

    req (request object):

        - req.params: Contiene los parámetros de la URL, dentro de un objeto, cada parametro llega como una propiedad dentro de este. Para definir un parametro dentro de la ruta, colocamos el marcador ':' seguido del nombre del parametro, cualquier valor que aparezca dentro de esa posición en la URL sera capturado y estará disponible dentro del objeto req.params.
        * Podemos utilizar diferentes parametros en una misma url. ej: libros/:genero/:autor
    
        - req.query: Es un objeto que va a contener los parametros que me llegen como Query Params(parámetros de consulta) ?limit=10.
        * No se deben especificar en la definición de la ruta, sino que se capturan de forma directa dentro del handler, por lo general, son opcionales y complementan la operación principal.

        -req.body: es el medio principal para recibir datos complejos y estructurados enviados por el cliente dentro del cuerpo de la petición, por ejemplo, cuando recibimos una peticion tipo POST o PUT.
            * Necesitamos el uso de un 'middleware' (software intermedio) para que express pueda entender y parsear correctamente el formato de los datos que vienen dentro del cuerpo de la solicitud (no lo hace por defecto), una vez indicamos este procedimiento la información ya va a estar disponible dentro de req.body

            - las formas más utilizadas para enviar información son:

                - JSON: es el formato más común utilizado por APIS. Middleware para parsear JSON -> app.use(express.json()) -> esto parsea solicitudes que tengan 'Content-Type: application/json'
                - URL-enconded: El formato utilizado en formularios HTML. el middelware para parsear este tipo de formato, app.use(express.urlencoded({ extended: true })). Este middleware parsea solicitudes con 'Content-Type: application/x-www-form-urlencoded'. Extended:true -> permite objetos y arrays anidados dentro del body.
                - Otros tipos de Body: aquellos tipos por ej, que me permitan procesar una archivo (img,pdf,etc), se utilizan middlewares especializados como por ej, multer, que manejan el formato multipart/form-data.
            
        - req.headers: Nos permite manipular las cabeceras de la petición.

        - req.method: Método HTTP.

        - req.url: La URL que se está solicitando (endpoint)


        res (Response Object):

        - res.send(data): Enviar una respuestra HTTP (String, Buffer, Object, Array) Automaticamente se establece el 'Content-Type'
        - res.json(obj): Establece especificamente una respuesta en formato JSON.
        - res.status(code): Establece el código de estado HTTP. Se concatena con send() o json()
        - res.sendStatus(204): Establece el código de estado HTTP y envía el texto por defecto.
        - res.redirect(url): redirecciona a una URL.
        - res.sendFile(path): Envía un archivo, ej, una página HTML.
        - res.header(): Establece las cabeceras de la respuesta.




*/

/* 

    #### MIDDLEWARES:

    En express, un middleware es una función que tiene acceso a el objeto de la solicitud y al de la respuesta (req, res), y además a la siguiente función middler/handler final. 
    Podemos definirlos como una serie de filtros o pasos previos a la respuesta final por la cual pasa una solicitud.

    Pueden hacer:

    - Ejecutar cualquier instrucción o bloque código necesario previo a la respuesta final.
    - Manipular los objetos de solicitud y respuesta.
    - Finalizar el ciclo de solicitud-respuesta antes de llegar al handler final.
    - llamar al siguiente middleware.

    Para pasar de un middleware al siguiente, se debe utilziar la función next() -> es propia de todo middleware. De esta manera pasamos el control a la siguiente función. Si no se pasa al siguiente función y tampoco finaliza el ciclo, la solicitud quedará 'colgada'.



    ## Para que ejemplos podemos utilizarlos? 

    - Parseo del body: por ej, los middlewares nativos de express -> express.json() y express.urlencoded(), permiten transformar el cuerpo de la solicitud en un formato que nos permita manipularlo con JS.
    - Logging de movimientos (Registro de movimientos): Nos permiten registrar los detalles de las solicitudes (hora, metodo, url, ip del cliente ,etc..), debugg/depurar la app, y para auditorias.
    - Autenticación y Autorización: verificar si un usuario está logeado, y además si tiene los permisos necesarios para acceder a la acción que solicita.
    - Manejo de sesiones: Crear y gestionar sesiones (cookies o headers de autenticación) para procesar el estado entre solicitudes.
    - Manejor errores: capturar y procesar errores que ocurran durante el ciclo de vida de la solicitud, enviando respuestas apropiadas al cliente.
    - Servir archivos estáticos: cuando tenemos que compartir archivos (img, html, css, js, etc..) debemos indicar cuales de estos son 'public', se utiliza express.static(rutaDelArchivoCarpeta)
    - Manipulación de las solicitudes / respuestas, podes añadir propiedades o modificar encabezados antes de enviar la respuesta final.


    ## Cómo se aplican los Middlewares?
    Depende de que tan amplio queremos que sea el alcance de este.

    1. Middleware a nivel de aplicación: Estos se aplican a TODAS las soliciutdes que llegan a la app. Son ideales por ej, para procesos Logging, autenticación general, o parseo del cuerpo de la solicitud.

    2. Middleware a nivel de ruta especifica. Podemos directamente/exclusivamente el middleware a aquella ruta que lo necesite, por ej: validación de datos de forma previa a crear un recurso, o autenticación necesaria para un acción especifica.

    3. Middlewares a nivel de Enrutador: Podemos aplicar middlwares a un objeto enrutador especifico (router). Es útil para poder aplicar un lógica especifica a un conjunto de rutas relacionadas entre sí.

    4. Middleware manejador de errores (centralizar el control y respuesta de errores de toda la app.)

    
*/
