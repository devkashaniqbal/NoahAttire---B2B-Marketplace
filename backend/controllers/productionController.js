const Order = require('../models/Order');
const Worker = require('../models/Worker');
const WorkerAssignment = require('../models/WorkerAssignment');
const userStore = require('../utils/userStore');

exports.getOverview = async (req, res, next) => {
  try {
    const [stageAgg, activeOrders] = await Promise.all([
      Order.aggregate([
        { $match: { status: 'in-production' } },
        { $group: { _id: '$productionStage', count: { $sum: 1 } } },
      ]),
      Order.find({ status: { $in: ['pending', 'in-production', 'ready'] } })
        .select('title quantity unitsCompleted status productionStage expectedDeliveryDate productionStartedAt createdAt buyerId sellerId')
        .sort({ createdAt: -1 }),
    ]);

    const stageMap = {};
    stageAgg.forEach(({ _id, count }) => { stageMap[_id] = count; });

    const orderIds = activeOrders.map((o) => o._id);
    const assignments = await WorkerAssignment.find({ orderId: { $in: orderIds } })
      .populate('workerId', 'name department hourlyRate');

    const assignmentsByOrder = {};
    assignments.forEach((a) => {
      const key = a.orderId.toString();
      if (!assignmentsByOrder[key]) assignmentsByOrder[key] = [];
      assignmentsByOrder[key].push(a);
    });

    const hydratedOrders = await userStore.hydrate(activeOrders, ['buyerId', 'sellerId']);

    res.json({
      stageCounts: {
        cutting: stageMap.cutting || 0,
        stitching: stageMap.stitching || 0,
        packing: stageMap.packing || 0,
        done: stageMap.done || 0,
      },
      orders: hydratedOrders.map((o) => ({
        ...o,
        assignments: assignmentsByOrder[o._id.toString()] || [],
      })),
    });
  } catch (err) {
    next(err);
  }
};

// ---------- Workers ----------

exports.getWorkers = async (req, res, next) => {
  try {
    const { department, status } = req.query;
    const query = {};
    if (department && department !== 'all') query.department = department;
    if (status && status !== 'all') query.status = status;
    const workers = await Worker.find(query).sort({ createdAt: -1 });
    res.json({ workers });
  } catch (err) {
    next(err);
  }
};

exports.createWorker = async (req, res, next) => {
  try {
    const { name, phone, department, hourlyRate } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Worker name is required' });
    const worker = await Worker.create({
      name: name.trim(),
      phone: phone?.trim() || '',
      department: department || 'other',
      hourlyRate: Number(hourlyRate) || 0,
    });
    res.status(201).json({ worker, message: 'Worker added' });
  } catch (err) {
    next(err);
  }
};

exports.updateWorker = async (req, res, next) => {
  try {
    const { name, phone, department, hourlyRate, status } = req.body;
    const update = {};
    if (name !== undefined) update.name = name.trim();
    if (phone !== undefined) update.phone = phone.trim();
    if (department !== undefined) update.department = department;
    if (hourlyRate !== undefined) update.hourlyRate = Number(hourlyRate) || 0;
    if (status !== undefined) update.status = status;

    const worker = await Worker.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!worker) return res.status(404).json({ message: 'Worker not found' });
    res.json({ worker, message: 'Worker updated' });
  } catch (err) {
    next(err);
  }
};

exports.deleteWorker = async (req, res, next) => {
  try {
    const worker = await Worker.findByIdAndDelete(req.params.id);
    if (!worker) return res.status(404).json({ message: 'Worker not found' });
    await WorkerAssignment.deleteMany({ workerId: req.params.id });
    res.json({ message: 'Worker removed' });
  } catch (err) {
    next(err);
  }
};

// ---------- Worker Assignments ----------

exports.getAssignments = async (req, res, next) => {
  try {
    const { orderId, workerId } = req.query;
    const query = {};
    if (orderId) query.orderId = orderId;
    if (workerId) query.workerId = workerId;
    const assignments = await WorkerAssignment.find(query)
      .populate('workerId', 'name department hourlyRate')
      .populate('orderId', 'title status productionStage')
      .sort({ createdAt: -1 });
    res.json({ assignments });
  } catch (err) {
    next(err);
  }
};

exports.createAssignment = async (req, res, next) => {
  try {
    const { workerId, orderId, stage, hoursLogged } = req.body;
    if (!workerId || !orderId || !stage) {
      return res.status(400).json({ message: 'workerId, orderId, and stage are required' });
    }
    if (!['cutting', 'stitching', 'packing'].includes(stage)) {
      return res.status(400).json({ message: 'Invalid stage' });
    }

    const [worker, order] = await Promise.all([
      Worker.findById(workerId),
      Order.findById(orderId),
    ]);
    if (!worker) return res.status(404).json({ message: 'Worker not found' });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const assignment = await WorkerAssignment.create({
      workerId,
      orderId,
      stage,
      hoursLogged: Number(hoursLogged) || 0,
    });
    await assignment.populate('workerId', 'name department hourlyRate');
    res.status(201).json({ assignment, message: 'Worker assigned' });
  } catch (err) {
    next(err);
  }
};

exports.deleteAssignment = async (req, res, next) => {
  try {
    const assignment = await WorkerAssignment.findByIdAndDelete(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    res.json({ message: 'Assignment removed' });
  } catch (err) {
    next(err);
  }
};
