require('dotenv').config();

const express = require('express');
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

// Configuración DB desde variables de entorno
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
};

// Función para obtener conexión
async function getConnection() {
  return await mysql.createConnection(dbConfig);
}

// Rutas CRUD (igual que antes)

app.get('/credenciales', async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.query('SELECT * FROM credenciales');
    await conn.end();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/credenciales/id/:id', async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.query('SELECT * FROM credenciales WHERE id = ?', [req.params.id]);
    await conn.end();
    if (rows.length === 0) return res.status(404).json({ error: 'No se encontró la credencial con ese id' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/credenciales/curp/:curp', async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.query('SELECT * FROM credenciales WHERE curp = ?', [req.params.curp]);
    await conn.end();
    if (rows.length === 0) return res.status(404).json({ error: 'No se encontró la credencial con esa CURP' });
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/credenciales', async (req, res) => {
  try {
    const { clave_ine, curp, IDpersona } = req.body;
    if (!clave_ine || !curp || !IDpersona) {
      return res.status(400).json({ error: 'Faltan datos requeridos: clave_ine, curp, IDpersona' });
    }
    const conn = await getConnection();
    const id = uuidv4();
    await conn.query(
      'INSERT INTO credenciales (id, clave_ine, curp, IDpersona) VALUES (?, ?, ?, ?)',
      [id, clave_ine, curp, IDpersona]
    );
    await conn.end();
    res.status(201).json({ id, clave_ine, curp, IDpersona });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/credenciales/:id', async (req, res) => {
  try {
    const { clave_ine, curp, IDpersona } = req.body;
    const { id } = req.params;
    const conn = await getConnection();
    const [rows] = await conn.query('SELECT * FROM credenciales WHERE id = ?', [id]);
    if (rows.length === 0) {
      await conn.end();
      return res.status(404).json({ error: 'No se encontró la credencial con ese id' });
    }
    const updated = {
      clave_ine: clave_ine || rows[0].clave_ine,
      curp: curp || rows[0].curp,
      IDpersona: IDpersona || rows[0].IDpersona,
    };
    await conn.query(
      'UPDATE credenciales SET clave_ine = ?, curp = ?, IDpersona = ? WHERE id = ?',
      [updated.clave_ine, updated.curp, updated.IDpersona, id]
    );
    await conn.end();
    res.json({ id, ...updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/credenciales/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const conn = await getConnection();
    const [result] = await conn.query('DELETE FROM credenciales WHERE id = ?', [id]);
    await conn.end();
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'No se encontró la credencial con ese id' });
    }
    res.json({ message: 'Registro eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/credenciales/curp/:curp', async (req, res) => {
  try {
    const { curp } = req.params;
    const conn = await getConnection();
    const [result] = await conn.query('DELETE FROM credenciales WHERE curp = ?', [curp]);
    await conn.end();
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'No se encontró la credencial con esa CURP' });
    }
    res.json({ message: 'Registro eliminado correctamente por CURP' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
