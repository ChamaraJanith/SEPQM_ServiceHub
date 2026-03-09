import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  serviceSlug: {
    type: String,
    required: [true, 'Service slug is required.'],
    enum: {
      values: ['house-cleaning', 'ac-repair', 'plumbing', 'electrical'],
      message: 'Invalid service selected ({VALUE}).'
    }
  },
  serviceName: {
    type: String,
    required: [true, 'Service name is required.']
  },
  name: {
    type: String,
    required: [true, 'Name is required.'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long.'],
    maxlength: [100, 'Name cannot exceed 100 characters.']
  },
  email: {
    type: String,
    required: [true, 'Email is required.'],
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.']
  },
  date: {
    type: String,
    required: [true, 'Date is required.'],
    validate: {
      validator: function(v) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
        const selected = new Date(v + 'T00:00:00'); // ensure local date
        const today = new Date();
        today.setHours(0,0,0,0);
        return selected >= today;
      },
      message: 'Date must be today or in the future and strictly in YYYY-MM-DD format.'
    }
  },
  timeSlot: {
    type: String,
    required: [true, 'Time slot is required.'],
    enum: {
      values: ['Morning', 'Afternoon', 'Evening'],
      message: '{VALUE} is an invalid time slot. Only Morning, Afternoon, or Evening allowed.'
    }
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters.']
  },
  address: {
    type: String,
    required: [true, 'Address is required. Select from the map.'],
    maxlength: [1000, 'Address cannot exceed 1000 characters.']
  },
  lat: { type: Number },
  lng: { type: Number },
  assignedWorker: {
    type: String,
    default: 'Unassigned'
  },
  totalAmount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

export default mongoose.model('Booking', bookingSchema);
