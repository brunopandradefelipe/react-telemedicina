const express = require("express");
const router = express.Router();
const medicalRecordController = require("../controllers/medicalRecordController");

// Rota para criar um novo prontuário
router.post("/", medicalRecordController.createMedicalRecord);

// Rota para obter todos os prontuários
router.get("/", medicalRecordController.getAllMedicalRecords);

// Rota para obter um prontuário específico por ID
router.get("/:id", medicalRecordController.getMedicalRecordById);

// Rota para obter prontuários por nome do paciente
router.get(
  "/patient/:name",
  medicalRecordController.getMedicalRecordsByPatientName
);

module.exports = router;
