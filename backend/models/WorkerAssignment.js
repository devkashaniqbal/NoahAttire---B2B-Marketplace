const mongoose = require('mongoose');

const workerAssignmentSchema = new mongoose.Schema(
  {
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    stage: { type: String, enum: ['cutting', 'stitching', 'packing'], required: true },
    hoursLogged: { type: Number, default: 0, min: 0 },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

workerAssignmentSchema.index({ orderId: 1 });
workerAssignmentSchema.index({ workerId: 1 });

module.exports = mongoose.model('WorkerAssignment', workerAssignmentSchema);
