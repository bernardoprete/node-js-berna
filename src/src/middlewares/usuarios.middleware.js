export const validarDatosUsuarioAlRegistrar = (req, res, next) => {
  // agregar la llegada de passwordConfirm -> compararlo con el password.
  const { nombre, edad, email, password, passwordConfirm } = req.body;
  try {
    if (
      !req.body ||
      !nombre ||
      !edad ||
      !email ||
      !password ||
      !passwordConfirm // desestructurar el req.body y usar sus propiedades para validar
    ) {
      throw new Error("No puede dejar campos vacíos.");
    }
    next();
  } catch (error) {
    error.status = 400;
    next(error);
  }
};

export const validarDatosUsuarioAlModificar = (req, res, next) => {
  try {
    if (!req.body) {
      throw new Error("No puede dejar todos los campos vacios."); //// desestructurar el req.body y usar sus propiedades para validar
    }
    if (req.body.password) {
      throw new Error(
        "La contraseña no puede ser modificada desde esta ruta. Usa la opcion de cambio de contraseña."
      );
    }
    next();
  } catch (error) {
    error.status = 400;
    next(error);
  }
};
export const validarID = (req, res, next) => {
  const { id } = req.params;
  // equivalente -> const id = req.params.id.
  console.log(id);
  console.log(isNaN(id));

  try {
    if (isNaN(id)) {
      throw new Error("Error: ingrese un ID válido.");
    }
    next();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const validarEdadMinima = (req, res, next) => {
  const { edad } = req.body;

  try {
    if (edad < 18) {
      throw new Error("Debe ser mayor de 18 años.");
    }
    next();
  } catch (error) {
    error.status = 400;
    next(error);
  }
};
