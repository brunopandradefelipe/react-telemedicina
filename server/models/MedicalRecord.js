const mongoose = require("mongoose");

const MedicalRecordSchema = new mongoose.Schema({
  patientName: {
    type: String,
    required: true,
    trim: true,
  },
  symptoms: {
    type: String,
    required: true,
  },
  medicalHistory: {
    type: String,
    default: "",
  },
  recommendation: {
    type: String,
    required: true,
  },
  specialtyReferral: {
    type: String,
    default: "",
  },
  emergencyReferral: {
    type: Boolean,
    default: false,
  },
  summary: {
    type: String,
    required: true,
  },
  consultationDate: {
    type: Date,
    default: Date.now,
  },
  conversationHistory: [
    {
      role: {
        type: String,
        enum: ["assistant", "user"],
        required: true,
      },
      content: {
        type: String,
        required: true,
      },
    },
  ],
});

module.exports = mongoose.model("MedicalRecord", MedicalRecordSchema);
