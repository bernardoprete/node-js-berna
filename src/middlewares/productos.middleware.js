export const validarDatosProducto = (req, res, next) => {
  // En el body no pueden faltar estos datos:
  try {
    if (
      !req.body ||
      !req.body.nombre ||
      !req.body.categoria ||
      !req.body.precio ||
      !req.body.stock
    ) {
      throw new Error("No puede dejar campos vacíos.");
    }
    next();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const validarIdPost = async (req, res, next) => {
  // El id en los post put y delete tienen que ser si o si numeros.
  const { id } = req.body;
  // equivalente -> const id = req.body.id

  try {
    if (!id) {
      throw new Error("Error: No puede deja el campo de Id vacio");
    }
    next();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const validarIdParams = async (req, res, next) => {
  // El id en los post put y delete tienen que ser si o si numeros.
  const { id } = req.params;
  // equivalente -> const id = req.body.id

  try {
    if (isNaN(id)) {
      throw new Error("Error: El Id ingresado no es valido");
    }
    next();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
