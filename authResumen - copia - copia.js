/* 

    Modulo de registro y login de usuario (Autenticación y Autorización)

    - Registro usuarios: al momento de registrar un nuevo usuario en nuestro sistema, se debe al menos validar dos datos importantes:

    1- Que el campo a través del cual se identifica al usuario sea unico, no se repita en ningun otro registro, ej: email, username. Ya que esto generaria inconvenientes / inconsistencias en el sistema.
    2- Hasheo de la password: es decir, encriptar y guardar esa contraseña en la base datos. Evitamos que si se filtra nuestra base de datos, la información más sensible del usuario no este vulnerable.
    ** diferencia entre hasheo y encriptación, en  que la primera es un proceso de un unico sentido, en cambio la encriptación puede desencripatarse.
    ** en el hasheo, es el 'salt', que es un conjunto de carácteres especiales que se adjuntan a la contraseña ingresada, generando una cadena unica, esto significa que dos usuario que tengan la misma contraseña, tienen distintos hash.

    123456 -> hasdhaskjdh1123456
    123456 -> llllllllllll123456


    - Autenticación: Se basa en poder identificar al usuario que desea ingresar a nuestro sistema, se toma como referencia el campo unico, y al momento de comparar / verificar las contraseñas debemos utilizar un metodo especial para poder comparar la contraseña ingresada (texto plano) con la contraseña que tenemos en la BD (hash). Una vez validado desencadenamos todo el procedimiento que nos permite identificar que el usuario ya está autenticado, y puede realizar acciones 'reservadas', para poder llevar a cabo este proceso vamos a hacer uso de JWT (Jason web token) + Manejo de Cookies (opcionalmente puede ser uso de cabeceras de la petición.)

    - Cookies: Es un espacio en la memoria del navegador, que nos va a permitir almacenar cierta información la cual, en este caso, vamos a implementar para identificar la autenticación del usuario (las podemos usar para muchas otras cosas). En cada peticion posterior a la creación de la cookie, el servidor automaticamente recibe las mismas, esto evita que el usuario deba re-ingresar constantemente o en cada petición que desee hacer. Nosotros la vamos a utilizar para almacenar el Token creado por JWT.

        - Para una seguridad optima, las cookies que contienen tokens de autenticación deben configurarse con las siguientes propiedades:

            HttpOnline: Impide que el cliente (JavaScript) acceda a la cookie, de esta manera evitamos que el token sea modificado.
            Secure: Asegura que la cookie solo se envie a través de conexiones Https cifradas, * esto particularmente lo vamos a configurar cuando el proyecto/app este en producción.
            SameSite: nos permite especificar el dominio sobre los cuales permitimos compartir las cookies. los Lax nos permiten cierta flexibilidad para la comunicación entre diferentes dominios.

    - JWT: Es un estandar compacto y seguro para el intercambio de información entre partes, codificadas como un objeto JSON. Este estandar nos permite generar un 'token' de acceso a traves del cual vamos a poder identificar si el usuario ingreso al sistema, y ademas si ese ingreso es válido, es decir, no existe una manipulación del mismo por parte del usuario.

    Cuando un usuario ingresa al sistema exitosamente, nuestro servidor Nodejs genera un JWT, este contienen información relevante sobre el usuario (su id, email, rol, etc..) estas propiedades son conocidas como 'claims' en el Payload. Es importante tener en cuentra que el JWT no esta encriptado especificamente para ocultar la información. En su lugar, esta 'firmado' digitalmente con una clave secreta (solo conoce el servidor). Esta firma garantiza dos cosas fundamentales:

        - Autenticidad: confirma que el token fue emitido por nuestro servidor.
        - Integridad: Asegura que el contenido del token no ha sido alterado desde que fue emitido, si alguien lo intenta modificar, la firma deja de ser válida.

    El JWT consta de tres partes, separadas por puntos (.): header.payload.signature

    - Header(cabecera): Describe el tipo de Token (JWT), y el algoritmo de firmado (ej: HS256, RS256)
        ej: {
            "alg": "HS256",
            "typ": "JWT"
        }
    - Payload (Carga util o cuerpo): Contiene las 'claims' o propiedades sobre la entidad (el usuario en este caso), y ademas metadatos adicionales (fecha expericacion, y fecha de emision..). Es importante tener en cuenta que esta info puede decodificarse, por lo tanto, no debemos almacenar información sensible.

    ej: {
        "id":"1213",
        "nombre":"Juan Perez",
        "rol": "admin",
        "iat": 1231231231231, // cuando fue emitido el token// claims standars
        "exp": 1231231231233 // especifica cuando expira el token // claim standars
    }
    
    -Signature (firma): Creada en base al header codificador, payload codificado, una clave secreta y el algoritmo espeficiado en el header. Todo este conjunto es el que nos permite validar la autenticación del token.

    Ej:

    eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30


    * Una vez generado este token se almacena en una cookie como mencionamos anteriormente.
    * Otra opción: enviar el token al front, y desde el cliente manden siempre el token con cada petición, por lo general, lo envian en las cabeceras, especificamente en la propiedad authorization, con la siguiente sintaxis: 
    * Bearer: jwt.
    


    Flujo de autenticaciñon con JWT:
    1. Solicitud de inicio de sesión: El usuario envía sus credenciales.
    2. Verificación de las crecenciales: Validar consultando la BD si el usuario existe, y comparando el hash con la password ingresada.
    3. Generamos el JWT si las credenciales son válidas, vamos a utilizar la librería (jsonwebtoken). Vamos a incluir en este token toda la info relevante del usuario dentro del payload, colocaremos una fecha expiración, se firma con una clave secreta.
    4. Almacenamiento del token dentro de la cookie o envío al cliente para que lo almacene y lo envie en cada nueva petición.
    5. Solicitudes posteriores: Para extraer/leer la cookie de las peticiones, debemos implementar un middleware para parsear, porque express por defecto, no parsea este tipo de datos (cookie-parser), en caso de recibirlo a través de las cabeceras, directamente lo extraemos de esta sin necesidad de un middleware.
    6. Verificación del token en el servidor: Verificamos el mismo a través del metodo verify() del a librería jsonwebtoken, en base, a la clave secreta, también se comprueba la fecha expiración, y por ultimo da como resultado el payload.
    7. El acceso al recurso: si el token es válido y la verificación del mismo exitosa, el servidor va a permitir el acceso al recurso solicitado, sino devolvemos un error ( 401 -> Unauthorized o 403 -> Forbidden.)



*/
