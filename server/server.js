const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");

// Carregar variáveis de ambiente
dotenv.config();

// Importar rotas
const medicalRecordRoutes = require("./routes/medicalRecordRoutes");

// Inicializar o app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Conectar ao MongoDB
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/telemedicine",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      authSource: "admin",
    }
  )
  .then(() => console.log("MongoDB conectado com sucesso"))
  .catch((err) => console.error("Erro ao conectar ao MongoDB:", err));

// Rotas
app.use("/api/medical-records", medicalRecordRoutes);

// Rota de teste
app.get("/", (req, res) => {
  res.send("API de Telemedicina funcionando!");
});

// Porta
const PORT = process.env.PORT || 5000;

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
