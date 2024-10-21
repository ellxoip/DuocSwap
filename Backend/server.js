const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const nodemailer = require('nodemailer');
const app = express();

// Configuración de multer para manejar la carga de archivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // Limita el tamaño del archivo a 5MB
  },
});



app.use(bodyParser.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: 'Content-Type, Authorization'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const dbConfig = {
  host: '127.0.0.1',
  user: 'root',
  password: 'duocswap',
  database: 'swaps', 
  port:3307
};

const pool = mysql.createPool(dbConfig);

// Inicia el servidor después de probar la conexión a la base de datos
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err.stack);
    return;
  }

  console.log('Conectado a la base de datos ');
  connection.release(); 

  // Inicia el servidor solo después de una conexión exitosa
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
  });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send({ message: 'El nombre de usuario y la contraseña son requeridos' });
  }

  try {
    // Verificar si hay usuarios en la tabla Usuario
    pool.query('SELECT COUNT(*) AS userCount FROM Usuario', (err, result) => {
      if (err) {
        console.error('Error durante la consulta:', err);
        return res.status(500).send({ message: 'Error interno del servidor' });
      }

      const userCount = result[0].userCount;

      // Si no hay usuarios registrados, permitir el login con las credenciales de administrador
      if (userCount === 0) {
        if (username === 'root' && password === '123456') {
          const rootUser = { id: 0, username: 'root' }; 
          const token = generateToken(rootUser); 
          return res.status(200).send({ message: 'Login realizado exitosamente con usuario administrador', token });
        } else {
          return res.status(401).send({ message: 'Credenciales inválidas' });
        }
      } else {
        // Si hay usuarios registrados, proceder con la autenticación normal
        pool.query('SELECT * FROM Usuario WHERE NombreUsuario = ?', [username], (err, results) => {
          if (err) {
            console.error('Error durante la consulta:', err);
            return res.status(500).send({ message: 'Error interno del servidor' });
          }

          if (results.length === 0) {
            return res.status(401).send({ message: 'Credenciales inválidas' });
          }

          const user = results[0];
          const Contrasena = user.Contrasena;

          if (bcrypt.compareSync(password, Contrasena)) {
            const token = generateToken(user); // Genera un token (implementa esta función)
            return res.status(200).send({ message: 'Login realizado exitosamente', token });
          } else {
            return res.status(401).send({ message: 'Credenciales inválidas' });
          }
        });
      }
    });
  } catch (err) {
    console.error('Error durante el login:', err);
    res.status(500).send({ message: 'Error interno del servidor' });
  }
});


// Función para generar un token 
function generateToken(user) {
  // Implementa la lógica para generar un token, por ejemplo usando jsonwebtoken
  return 'token'; // Reemplaza esto con el token real
}

// Obtener todas las tablas de la base de datos
app.get('/tables/:table', (req, res) => {
  const tableName = req.params.table;
  const validTables = ['Estudiante', 'Usuario', 'Material', 'Intercambio', 'Sanciones'];

  if (!validTables.includes(tableName)) {
    return res.status(400).send({ message: 'Nombre de tabla no válido' });
  }

  pool.query(`SELECT * FROM ??`, [tableName], (err, results) => {
    if (err) {
      console.error('Error durante la consulta:', err);
      return res.status(500).send({ message: 'Error interno del servidor' });
    }
    res.status(200).send(results);
  });
});


// Añadir un nuevo Material
app.post('/addTool', upload.single('portada'), (req, res) => {
  console.log('Cuerpo de la solicitud:', req.body);
  console.log('Archivo recibido:', req.file);

  const { serie, tipo, marca, modelo, categoria, descripcion, cantidades } = req.body;
  const portada = req.file ? req.file.buffer : null;

  console.log('Campos extraídos:', { serie, tipo, marca, modelo, categoria, descripcion, cantidades });

  if (!serie || !tipo || !marca || !modelo || !categoria || !cantidades) {
    console.log('Campos faltantes:', { serie, tipo, marca, modelo, categoria, cantidades });
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  const ejemplares = parseInt(cantidades, 10);
  if (isNaN(ejemplares)) {
    return res.status(400).json({ message: 'El número de Stock debe ser un número válido' });
  }

  const query = 'INSERT INTO Material (SERIE, Tipo, Marca, Modelo, Categoria, Descripcion, Cantidades, Portada) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  const values = [serie, tipo, marca, modelo, categoria, descripcion || null, ejemplares, portada];

  pool.query(query, values, (err) => {
    if (err) {
      console.error('Error durante la inserción:', err);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }

    res.status(201).json({ message: 'Material registrado exitosamente' });
  });
});

// Rutas para manejar Materials

// Actualizar solo la cantidad de stock
app.put('/updateTool/quantity/:serie', (req, res) => {
  const { serie } = req.params;
  const { Cantidades } = req.body;

  console.log('Datos recibidos para actualizar cantidad:', req.body);

  if (Cantidades === undefined) {
    return res.status(400).json({ message: 'El campo Cantidades es obligatorio' });
  }

  const query = 'UPDATE Material SET Cantidades = ? WHERE SERIE = ?';
  const values = [Cantidades, serie];

  pool.query(query, values, (err, result) => {
    if (err) {
      console.error('Error al actualizar la cantidad de Stock:', err);
      return res.status(500).json({ message: 'Error interno del servidor', error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Material no encontrado' });
    }

    res.status(200).json({ message: 'Cantidad de Materials actualizada exitosamente' });
  });
});

// Actualizar un Material (detalles)
app.put('/updateTool/:serie', upload.single('portada'), (req, res) => {
  const { serie } = req.params;
  const { Tipo, Marca, Modelo, Categoria, Descripcion, Cantidades } = req.body;
  const portada = req.file ? req.file.buffer : null;

  console.log('Datos recibidos para actualizar Material:', req.body);
  console.log('Archivo recibido:', req.file);

  if (!Tipo || !Marca || !Modelo || !Categoria || Cantidades === undefined) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios', camposFaltantes: { Tipo, Marca, Modelo, Categoria, Cantidades } });
  }

  let query = 'UPDATE Material SET Tipo = ?, Marca = ?, Modelo = ?, Categoria = ?, Descripcion = ?, Cantidades = ?';
  let values = [Tipo, Marca, Modelo, Categoria, Descripcion, Cantidades];

  if (portada) {
    query += ', Portada = ?';
    values.push(portada);
  }

  query += ' WHERE SERIE = ?';
  values.push(serie);

  pool.query(query, values, (err, result) => {
    if (err) {
      console.error('Error al actualizar el Material:', err);
      return res.status(500).json({ message: 'Error interno del servidor', error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Material no encontrado' });
    }

    res.status(200).json({ message: 'Material actualizado exitosamente' });
  });
});
// Eliminar un Material
app.delete('/deleteTool/:serie', (req, res) => {
  const { serie } = req.params;

  // Primero, eliminar los intercambios asociados
  pool.query('DELETE FROM Intercambio WHERE SERIE = ?', [serie], (err) => {
    if (err) {
      console.error('Error al eliminar los intercambios asociados:', err);
      return res.status(500).send({ message: 'Error interno del servidor', error: err.message });
    }

    // Ahora, eliminar el Material
    pool.query('DELETE FROM Material WHERE SERIE = ?', [serie], (err, result) => {
      if (err) {
        console.error('Error al eliminar la Material:', err);
        return res.status(500).send({ message: 'Error interno del servidor', error: err.message });
      }

      if (result.affectedRows === 0) {
        return res.status(404).send({ message: 'Material no encontrado' });
      }

      res.status(200).send({ message: 'Material eliminada exitosamente' });
    });
  });
});

// Nueva ruta para buscar Materials
app.get('/searchTools', (req, res) => {
  const { busqueda, marca, categoria, tipo } = req.query;
  let query = 'SELECT SERIE, Tipo, Marca, Modelo, Categoria, Descripcion, Cantidades, Portada FROM Material WHERE 1=1';
  const params = [];

  if (busqueda) {
    query += ' AND (Tipo LIKE ? OR Marca LIKE ? OR SERIE LIKE ?)';
    params.push(`%${busqueda}%`, `%${busqueda}%`, `%${busqueda}%`);
  }
  if (marca) {
    query += ' AND Marca = ?';
    params.push(marca);
  }
  if (categoria) {
    query += ' AND Categoria = ?';
    params.push(categoria);
  }
  if (tipo) {
    query += ' AND Tipo = ?';
    params.push(tipo);
  }

  pool.query(query, params, (err, results) => {
    if (err) {
      console.error('Error durante la búsqueda de Materials:', err);
      return res.status(500).send({ message: 'Error interno del servidor' });
    }
    res.status(200).send(results);
  });
});


// Nueva ruta para intercambio de Materials
app.post('/loanTool', (req, res) => {
  const { numeroControl, serie, fechaIntercambio, fechaDevolucion, idUsuario } = req.body;

  // Verificar si el número de control es proporcionado
  if (!numeroControl) {
      return res.status(400).send({ message: 'Ingresa el número de control' });
  }

  // Verificar si las fechas son válidas
  if (!fechaIntercambio || !fechaDevolucion) {
      return res.status(400).send({ message: 'Las fechas de intercambio y devolución son requeridas' });
  }

  const sql = 'INSERT INTO Intercambio (NumeroControl, SERIE, FechaIntercambio, FechaDevolucion, IdUsuario) VALUES (?, ?, ?, ?, ?)';
  const values = [numeroControl, serie, fechaIntercambio, fechaDevolucion, idUsuario];

  pool.query(sql, values, (err, results) => {
      if (err) {
          console.error('Error durante la inserción del intercambio:', err);
          return res.status(500).send({ message: 'Error interno del servidor' });
      }

      // Actualizar la cantidad de Stock después de registrar el intercambio
      const updateQuery = 'UPDATE Material SET Cantidades = Cantidades - 1 WHERE SERIE = ?';
      pool.query(updateQuery, [serie], (updateErr, updateResult) => {
          if (updateErr) {
              console.error('Error al actualizar la cantidad de Stock:', updateErr);
              return res.status(500).send({ message: 'Error interno del servidor' });
          }

          res.status(201).send({ message: 'intercambio registrado y cantidad de Materials actualizada exitosamente' });
      });
  });
});

    // Configuración de nodemailer
    //const userGmail = "";
    //const passAppGmail = "";
    
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: userGmail,
        pass: passAppGmail,
      },
      tls: {
        rejectUnauthorized: false,}

    });

    const crypto = require('crypto'); // Importar crypto para generar tokens

// Añadir un nuevo estudiante
app.post('/estudiante', (req, res) => {
  const { NombreCompleto, NumeroControl, Correo } = req.body;

  if (!NombreCompleto || !NumeroControl || !Correo) {
    return res.status(400).send({ message: 'Todos los campos son obligatorios' });
  }

  // Generar un token de confirmación
  const token = crypto.randomBytes(20).toString('hex');

  const query = 'INSERT INTO Estudiante (NombreCompleto, NumeroControl, Correo, TokenConfirmacion) VALUES (?, ?, ?, ?)';
  const values = [NombreCompleto, NumeroControl, Correo, token];

  pool.query(query, values, (err) => {
    if (err) {
      console.error('Error durante la inserción:', err);
      return res.status(500).send({ message: 'Error interno del servidor' });
    }

    const confirmUrl = `http://localhost:3000/confirm/${token}`;

// Enviar correo de confirmación
const mailOptions = {
  from: userGmail,
  to: Correo,
  subject: 'Confirma tu correo',
  html: `
    <div style="background-color: #f0f0f0; padding: 20px; text-align: center;">
      <div style="background-color: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
        <h1 style="font-size: 24px; color: #333;">Bienvenido a DuocSwap</h1>
        <p style="font-size: 18px; color: #555;">Hola <strong>${NombreCompleto}</strong>,</p>
        <p style="font-size: 18px; color: #555;">Por favor confirma tu correo haciendo clic en el siguiente enlace:</p>
        <p>
          <a href="${confirmUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-align: center; text-decoration: none; display: inline-block; border-radius: 5px; font-size: 18px;">
            Confirmar Correo
          </a>
        </p>
        <p style="font-size: 16px; color: #555;">Saludos,<br>Del equipo de DuocSwap</p>
      </div>
    </div>
  `
};


    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error al enviar el correo:', error);
      } else {
        console.log('Correo enviado: ' + info.response);
      }
    });

    res.status(201).send({ message: 'Estudiante registrado exitosamente. Revisa tu correo para confirmar.' });
  });
});

// Ruta para confirmar el correo
app.get('/confirm/:token', (req, res) => {
  const { token } = req.params;

  // Buscar el Estudiante por el token y actualizar el estado de correo confirmado
  const query = 'UPDATE Estudiante SET CorreoConfirmado = TRUE WHERE TokenConfirmacion = ?';
  
  pool.query(query, [token], (err, result) => {
    if (err) {
      console.error('Error al confirmar el correo:', err);
      return res.status(500).send({ message: 'Error interno del servidor' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).send({ message: 'Estudiante no encontrado o el token es inválido' });
    }
// Mostrar mensaje de confirmación
     res.send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmación de Correo</title>
        <style>
          .confirmation-message {
            max-width: 600px;
            margin: 20px auto;
            padding: 20px;
            border: 1px solid #007bff; /* Color del borde acorde a tu botón */
            border-radius: 10px;
            background-color: #f9f9f9; /* Fondo claro */
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            text-align: center;
          }
          .confirmation-message h2 {
            color: #007bff; /* Color del típo */
            font-size: 24px;
          }
          .confirmation-message p {
            color: #333; /* Color del texto */
            font-size: 18px;
          }
        </style>
      </head>
      <body>
        <div class="confirmation-message">
          <h2>Correo Confirmado Exitosamente</h2>
          <p>¡Gracias por unirte a DuocSwap!</p>
        </div>
      </body>
      </html>
    `);
  });
});



// Actualizar un estudiante
app.put('//estudiante:id', (req, res) => {
  const { id } = req.params;
  const { NombreCompleto, NumeroControl, Correo } = req.body;

  if (!NombreCompleto || !NumeroControl || !Correo) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  const query = 'UPDATE Estudiante SET NombreCompleto = ?, NumeroControl = ?, Correo = ? WHERE id = ?';
  const values = [NombreCompleto, NumeroControl, Correo, id];

  pool.query(query, values, (err, result) => {
    if (err) {
      console.error('Error al actualizar al estudiante:', err);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Estudiante no encontrado' });
    }

    res.status(200).json({ message: 'Estudiante actualizado exitosamente' });
  });
});

// Eliminar un estudiante
app.delete('/estudiante/:id', (req, res) => {
  const { id } = req.params;

  pool.query('DELETE FROM Estudiante WHERE id = ?', [id], (err) => {
    if (err) {
      console.error('Error durante la eliminación:', err);
      return res.status(500).send({ message: 'Error interno del servidor' });
    }

    res.status(200).send({ message: 'Estudiante eliminado exitosamente' });
  });
});

// Buscar estudiantes
app.get('/estudiante', (req, res) => {
  const { busqueda, NumeroControl, Correo, NombreCompleto } = req.query;
  let query = 'SELECT * FROM Estudiante WHERE 1=1';
  const params = [];

  if (busqueda) {
    query += ' AND (nombreCompleto LIKE ? OR numeroControl LIKE ? OR correo LIKE ?)';
    params.push(`%${busqueda}%`, `%${busqueda}%`, `%${busqueda}%`);
  }
  if (NumeroControl) {
    query += ' AND numeroControl = ?';
    params.push(NumeroControl);
  }
  if(Correo) {
    query += ' AND correo = ?';
    params.push(Correo);
  }
  if (NombreCompleto) {
    query += ' AND nombreCompleto = ?';
    params.push(NombreCompleto);
  }


pool.query(query, params, (err, results) => {
  if (err) {
    console.error('Error durante la búsqueda de Estudiantes:', err);
    return res.status(500).send({ message: 'Error interno del servidor' });
  }
  res.status(200).send(results);
});
});








// Obtener marcas y editoriales
app.get('/api/materials/marcas-editoriales', (req, res) => {
const query = `
  SELECT DISTINCT Marca, Categoria
  FROM Material
  ORDER BY Marca, Categoria
`;

pool.query(query, (err, results) => {
  if (err) {
    console.error('Error al obtener marcas y editoriales:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
  
  const marcas = [...new Set(results.map(row => row.Marca))];
  const editoriales = [...new Set(results.map(row => row.Categoria))];
  
  res.json({ marcas, editoriales });
});
});

// Añadir un nuevo Usuario
app.post('/usuarios', (req, res) => {
const { NombreCompleto, Correo, Telefono, IdAdmin, NombreUsuario, Contrasena } = req.body;

if (!NombreCompleto || !Correo || !Telefono || !NombreUsuario || !Contrasena) {
  return res.status(400).send({ message: 'Todos los campos son obligatorios' });
}
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(Contrasena, salt);

const query = 'INSERT INTO Usuario (NombreCompleto, Correo, Telefono, IdAdmin, NombreUsuario, Contrasena) VALUES (?, ?, ?, ?, ?, ?)';
const values = [NombreCompleto, Correo, Telefono, IdAdmin, NombreUsuario, hash];

pool.query(query, values, (err) => {
  if (err) {
    console.error('Error durante la inserción:', err);
    return res.status(500).send({ message: 'Error interno del servidor' });
  }

  res.status(201).send({ message: 'Usuario registrado exitosamente' });
});
});

// Actualizar un Usuario
app.put('/usuarios/:id', (req, res) => {
const { id } = req.params;
const { NombreCompleto, Correo, Telefono, IdAdmin, NombreUsuario, Contrasena } = req.body;

if (!NombreCompleto || !Correo || !Telefono || !IdAdmin || !NombreUsuario || !Contrasena) {
  return res.status(400).json({ message: 'Todos los campos son obligatorios' });
}

const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(Contrasena, salt);

const query = 'UPDATE Usuario SET NombreCompleto = ?, Correo = ?, Telefono = ?, IdAdmin = ?, NombreUsuario = ?, Contrasena = ? WHERE IdUsuario = ?';
const values = [NombreCompleto, Correo, Telefono, IdAdmin, NombreUsuario, hash, id];

pool.query(query, values, (err, result) => {
  if (err) {
    console.error('Error al actualizar el usuario:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }

  if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }

  res.status(200).json({ message: 'Usuario actualizado exitosamente' });
});
});

// Eliminar un usuario
app.delete('/usuarios/:id', (req, res) => {
const { id } = req.params;

pool.query('DELETE FROM Usuario WHERE IdUsuario = ?', [id], (err) => {
  if (err) {
    console.error('Error durante la eliminación:', err);
    return res.status(500).send({ message: 'Error interno del servidor' });
  }

  res.status(200).send({ message: 'Usuario eliminado exitosamente' });
});
});

// Buscar usuarios
app.get('/usuarios', (req, res) => {
const { busqueda, NombreUsuario, Correo, NombreCompleto } = req.query;
let query = 'SELECT * FROM Usuario WHERE 1=1';
const params = [];

if (busqueda) {
  query += ' AND (NombreCompleto LIKE ? OR NombreUsuario LIKE ? OR Correo LIKE ?)';
  params.push(`%${busqueda}%`, `%${busqueda}%`, `%${busqueda}%`);
}
if (NombreUsuario) {
  query += ' AND NombreUsuario = ?';
  params.push(NombreUsuario);
}
if (Correo) {
  query += ' AND Correo = ?';
  params.push(Correo);
}
if (NombreCompleto) {
  query += ' AND NombreCompleto = ?';
  params.push(NombreCompleto);
}

pool.query(query, params, (err, results) => {
  if (err) {
    console.error('Error durante la búsqueda de usuarios:', err);
    return res.status(500).send({ message: 'Error interno del servidor' });
  }
  res.status(200).send(results);
});
});

// Manejador de errores global
app.use((err, req, res, next) => {
console.error(err.stack);
res.status(500).send('Algo salió mal!');
});

// Obtener todas las sanciones
app.get('/sanciones', (req, res) => {
  pool.query('SELECT * FROM Sanciones', (err, results) => {
    if (err) {
      console.error('Error al obtener las sanciones:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    res.json(results);
  });
});

// Obtener una sancion por ID
app.get('/sanciones/:id', (req, res) => {
  const { id } = req.params;

  // Validar que el ID sea un número entero positivo
  if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  pool.query('SELECT * FROM Sanciones WHERE Idsancion = ?', [id], (err, results) => {
    if (err) {
      console.error('Error al obtener la sancion:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    if (results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).json({ error: 'sancion no encontrada' });
    }
  });
});

//Crear sancion
app.post('/sanciones', (req, res) => {
  const { NumeroControl, Descripcion, FechaInicio, Estatus, IdIntercambio } = req.body;

  // Validar datos requeridos
  if (!NumeroControl || !Descripcion || !FechaInicio || !Estatus || !IdIntercambio) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  // Validar tipo de datos
  if (isNaN(Descripcion) || Number(Descripcion) < 0) {
    return res.status(400).json({ error: 'Descripcion debe tener un maximo de caracteres' });
  }

  if (isNaN(IdIntercambio) || Number(IdIntercambio) <= 0) {
    return res.status(400).json({ error: 'IdIntercambio debe ser un número entero positivo' });
  }

  const query = 'INSERT INTO Sanciones (NumeroControl, Descripcion, FechaInicio, Estatus, IdIntercambio) VALUES (?, ?, ?, ?, ?)';
  const values = [NumeroControl, Descripcion, FechaInicio, Estatus, IdIntercambio];

  pool.query(query, values, (err, results) => {
    if (err) {
      console.error('Error al crear la sancion:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    // Obtener el correo del Estudiante asociado al número de control
    const estudianteQuery = 'SELECT Correo FROM Estudiante WHERE NumeroControl = ?';
    pool.query(estudianteQuery, [NumeroControl], (err, estudianteResult) => {
      if (err) {
        console.error('Error al obtener el correo del estudiante:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
      }

      if (estudianteResult.length === 0) {
        return res.status(404).json({ error: 'Estudiante no encontrado' });
      }

      const correoEstudiante = estudianteResult[0].Correo;

      // Enviar correo al estudiante
      const mailOptions = {
        from: userGmail,
        to: correoEstudiante,
        subject: 'Notificación de Sancion en DuocSwap',
        html: `
          <div style="background-color: #f0f0f0; padding: 20px; text-align: center;">
            <div style="background-color: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
              <h1 style="font-size: 24px; color: #333;">Notificación de sancion</h1>
              <p style="font-size: 18px; color: #555;">Estimado Estudiante,</p>
              <p style="font-size: 18px; color: #555;">Se ha registrado una nueva sancion en su cuenta con el número de control <strong>${NumeroControl}</strong>.</p>
              <p style="font-size: 18px; color: #555;">Descripcion: <strong>${Descripcion} MXN</strong></p>
              <p style="font-size: 16px; color: #555;">Por favor, acercarse a su jefatura para realizar el pago correspondiente.</p>
              <p style="font-size: 16px; color: #555;">Saludos,<br>El equipo de DuocSwap</p>
            </div>
          </div>
        `
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error al enviar el correo:', error);
          // Si ocurre un error al enviar el correo, aún retornamos el éxito en la creación de la sancion
          return res.status(201).json({ 
            id: results.insertId, 
            message: 'sancion registrada, pero no se pudo enviar el correo.'
          });
        } else {
          console.log('Correo enviado: ' + info.response);
          return res.status(201).json({ 
            id: results.insertId, 
            message: 'sancion registrada y correo enviado exitosamente'
          });
        }
      });

        

    res.status(201).json({ id: results.insertId });
  });
});
});

// Actualizar una sancion
app.patch('/sanciones/:id', (req, res) => {
  const { id } = req.params;
  const { NumeroControl, Descripcion, FechaInicio, Estatus, IdIntercambio } = req.body;

  // Validar que el ID sea un número entero positivo
  if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  // Validar datos requeridos
  if (NumeroControl === undefined || Descripcion === undefined || FechaInicio === undefined || Estatus === undefined || IdIntercambio === undefined) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  // Validar tipo de datos
  if (isNaN(Descripcion) || Number(Descripcion) < 0) {
    return res.status(400).json({ error: 'Descripcion debe ser un número positivo' });
  }

  if (isNaN(IdIntercambio) || Number(IdIntercambio) <= 0) {
    return res.status(400).json({ error: 'IdIntercambio debe ser un número entero positivo' });
  }

  const sql = 'UPDATE Sanciones SET NumeroControl = ?, Descripcion = ?, FechaInicio = ?, Estatus = ?, IdIntercambio = ? WHERE IdSancion = ?';
    const values = [NumeroControl, Descripcion, FechaInicio, Estatus, IdIntercambio, id];

  pool.query(sql, values, (err, results) => {
      if (err) {
        console.error('Error al actualizar la sancion:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
      }
      if (results.affectedRows > 0) {
        res.json({ message: 'sancion actualizada exitosamente' });
      } else {
        res.status(404).json({ error: 'sancion no encontrada' });
      }
  });
});

// Eliminar una sancion
app.delete('/sanciones/:id', (req, res) => {
  const { id } = req.params;

  // Validar que el ID sea un número entero positivo
  if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  pool.query('DELETE FROM Sanciones WHERE Idsancion = ?', [id], (err, results) => {
    if (err) {
      console.error('Error al eliminar la sancion:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    if (results.affectedRows > 0) {
      res.json({ message: 'sancion eliminada exitosamente' });
    } else {
      res.status(404).json({ error: 'sancion no encontrada' });
    }
  });
});


 //Obtener todos los intercambios V2
 app.get('/loan', (req, res) => {
  const query = `
  SELECT p.IdIntercambio, p.SERIE, p.NumeroControl, p.FechaIntercambio, p.FechaDevolucion, l.Tipo
  FROM Intercambio p
  JOIN Material l ON p.SERIE = l.SERIE
  WHERE p.Estado = 'Pendiente'
`;

  pool.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener intercambios:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    res.json(results);
  });
});

 //Obtener todos los intercambios
app.get('/loans', (req, res) => {
  const query = `
  SELECT p.IdIntercambio as id, p.SERIE, p.NumeroControl, p.FechaIntercambio, p.FechaDevolucion, l.Tipo
  FROM Intercambio p
  JOIN Material l ON p.SERIE = l.SERIE
  WHERE p.Estado = 'Pendiente'
`;

  pool.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener intercambios:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    res.json(results);
  });
});

// Devolver un Material
app.delete('/returnTool/:id', (req, res) => {
  const { id } = req.params;
  console.log('ID del intercambio a devolver:', id);

  pool.query('SELECT SERIE FROM Intercambio WHERE IdIntercambio = ? ', [id,], (err, result) => {
    if (err) {
      console.error('Error al obtener el SERIE del intercambio:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    console.log('Resultado de la consulta:', result); // Para verificar qué se está devolviendo

    if (result.length === 0) {
      return res.status(404).json({ error: 'intercambio no encontrado' });
    }

    const serie = result[0].SERIE;

    pool.query('Update Intercambio SET Estado = ? WHERE IdIntercambio = ?', ['Devuelto',id], (err) => {
      if (err) {
        console.error('Error al devolver el Material:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
      }

      pool.query('SELECT Cantidades FROM Material WHERE SERIE = ?', [serie], (err, toolResult) => {
        if (err) {
          console.error('Error al obtener la cantidad de Stock del Material:', err);
          return res.status(500).json({ error: 'Error interno del servidor' });
        }
        if (toolResult.length === 0) {
          return res.status(404).json({ error: 'Material no encontrado' });
        }

        const currentQuantity = toolResult[0].Cantidades;

        const newQuantity = currentQuantity + 1; // Aquí solo sumas 1 al eliminar el intercambio
        pool.query('UPDATE Material SET Cantidades = ? WHERE SERIE = ?', [newQuantity, serie], (err) => {
          if (err) {
            console.error('Error al actualizar la cantidad de Stock:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
          }

          res.json({ message: 'intercambio eliminado y cantidad de Materials actualizada exitosamente' });
        });
      });
    });
  });
});


// End point para el reporte personalizado
app.get('/Reporte', (req, res) => {
  const { fechaInicio, fechaFin } = req.query;

  let query = `
    SELECT 
      p.IdIntercambio,
      p.NumeroControl,
      l.NombreCompleto AS NombreEstudiante,
      l.Correo AS CorreoEstudiante,
      p.SERIE,
      lb.Tipo AS TipoMaterial,
      lb.Marca AS MarcaMaterial,
      p.FechaIntercambio,
      p.FechaDevolucion,
      p.IdUsuario,
      p.Estado
    FROM Intercambio p
    JOIN Estudiante l ON p.NumeroControl = l.NumeroControl
    JOIN Material lb ON p.SERIE = lb.SERIE
  `;

  let queryParams = [];

  if (fechaInicio && fechaFin) {
    query += ` WHERE p.FechaIntercambio BETWEEN ? AND ?`;
    queryParams.push(fechaInicio, fechaFin);
  }

  pool.query(query, queryParams, (err, results) => {
    if (err) {
      console.error('Error ejecutando la consulta:', err);
      res.status(500).send('Error al obtener los intercambios.');
    } else {
      console.log('Resultados de la consulta:', results); // Aquí inspeccionas los resultados
      res.json(results);
    }
  });
});



// Obtener un estudiante por su número de control
app.get('/estudiante/:numeroControl', (req, res) => {
  const { numeroControl } = req.params;

  pool.query('SELECT * FROM Estudiante WHERE NumeroControl = ?', [numeroControl], (err, results) => {
      if (err) {
          console.error('Error al obtener el Estudiante:', err);
          return res.status(500).send({ message: 'Error interno del servidor' });
      }
      if (results.length === 0) {
          return res.status(404).send({ message: 'Estudiante no encontrado' });
      }
      res.status(200).send(results[0]);
  });
});