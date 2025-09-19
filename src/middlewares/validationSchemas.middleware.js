export const validateSchema = (schema) => (req, res, next) => {
    // Datos a validar, aquellos que lleguen desde el cliente.
    const dataToValidate = { ...req.body, ...req.params } // Juntamos lo que viene en el body y/o en los parametros de consulta en un mismo objeto lalamado dataToValidate para validar.

    const result = schema.safeParse(dataToValidate) //  Nunca rompe el código: devuelve un objeto con la validación.

    // validamos el resultado de la validación - Aqui result que es un objeto puede tener 2 formas, la primera es que result.succes = true (es exitosa la validacion) o que sea false y dentro de este objeto esta issues que es un array con objetos adentro POR ESO HACEMOS EL MAP para ver los que queramos.
    if (!result.success) {
        // si falla la validación, vamos a mostrar/retornar los mensajes de error mapeando ese array que es issues y mostrando los errores.
        const issues = result.error.issues.map(issue => ({ 
            path: issue.path.join('.'),
            message: issue.message
        }))
        return res.status(400).json({ errors: issues }) //retornamos estado 400 y la lista de erroes.
    }
    // validación exitosa. result.data - es un objeto -> devuelve todos los campos que pasaron la validación, ignorando los que no están presentenes en el schema.

    const { id, ...data } = result.data;
    req.body = data;
    req.params.id = id;
    next();
}