require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

/* ===============================
   CONEXIÓN MONGO
================================= */

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("Mongo conectado"))
  .catch(err => console.log("Error Mongo:", err));

/* ===============================
   MODELO TELEPROMPTER
================================= */

const teleprompterSchema = new mongoose.Schema({
  nombre: String,
  slug: { type: String, unique: true },
  activo: { type: Boolean, default: true },
  fechaExpiracion: Date
});

const Teleprompter = mongoose.model("Teleprompter", teleprompterSchema, "asesores_teleprompter");

/* ===============================
   VALIDAR ACCESO
================================= */

app.get("/api/teleprompter/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const asesor = await Teleprompter.findOne({ slug });

    if (!asesor) {
      return res.status(404).json({ acceso: false, mensaje: "No existe" });
    }

    if (!asesor.activo) {
      return res.status(403).json({ acceso: false, mensaje: "Desactivado" });
    }

    if (asesor.fechaExpiracion && asesor.fechaExpiracion < new Date()) {
      return res.status(403).json({ acceso: false, mensaje: "Expirado" });
    }

    res.json({ acceso: true });

  } catch (error) {
    res.status(500).json({ error: "Error servidor" });
  }
});

/* ===============================
   CREAR ASESOR (para panel futuro)
================================= */

app.post("/api/teleprompter", async (req, res) => {
  try {
    const { nombre, slug, dias } = req.body;

    const fechaExpiracion = new Date();
    fechaExpiracion.setDate(fechaExpiracion.getDate() + dias);

    const nuevo = new Teleprompter({
      nombre,
      slug,
      fechaExpiracion
    });

    await nuevo.save();

    res.json({ creado: true });

  } catch (error) {
    res.status(500).json({ error: "Error al crear" });
  }
});

/* =============================== */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor corriendo en puerto", PORT));
