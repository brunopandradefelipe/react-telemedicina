const MedicalRecord = require("../models/MedicalRecord");

// Criar um novo prontuário médico
exports.createMedicalRecord = async (req, res) => {
  try {
    const newRecord = new MedicalRecord(req.body);
    const savedRecord = await newRecord.save();
    res.status(201).json({
      success: true,
      data: savedRecord,
      message: "Prontuário médico criado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao criar prontuário:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao criar prontuário médico",
      error: error.message,
    });
  }
};

// Obter todos os prontuários
exports.getAllMedicalRecords = async (req, res) => {
  try {
    const records = await MedicalRecord.find().sort({ consultationDate: -1 });
    res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    console.error("Erro ao buscar prontuários:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar prontuários médicos",
      error: error.message,
    });
  }
};

// Obter um prontuário específico por ID
exports.getMedicalRecordById = async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Prontuário médico não encontrado",
      });
    }

    res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    console.error("Erro ao buscar prontuário:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar prontuário médico",
      error: error.message,
    });
  }
};

// Obter prontuários por nome do paciente
exports.getMedicalRecordsByPatientName = async (req, res) => {
  try {
    const { name } = req.params;
    const records = await MedicalRecord.find({
      patientName: { $regex: name, $options: "i" },
    }).sort({ consultationDate: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    console.error("Erro ao buscar prontuários por nome:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar prontuários por nome do paciente",
      error: error.message,
    });
  }
};
