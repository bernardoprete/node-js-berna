export const validarDatosUsuario = (req, res, next) => {
  // agregar la llegada de passwordConfirm -> compararlo con el password.
  try {
    if (!req.body || !req.body.nombre || !req.body.edad) {
      throw new Error("No puede dejar campos vacíos.");
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
