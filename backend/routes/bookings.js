import express from 'express';
import Booking from '../models/Booking.js';
import { protect } from './auth.js';
import nodemailer from 'nodemailer';

const router = express.Router();

const sendEmail = async (to, subject, text, html) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
      }
    });

    const mailOptions = {
      from: '"ServiceHub" <no-reply@servicehub.com>',
      to,
      subject,
      text,
      html
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Email send error:', error);
  }
};

router.post('/', protect, async (req, res) => {
  try {
    const { serviceSlug, serviceName, name, email, date, timeSlot, notes, address, lat, lng } = req.body;
    
    // Server-side strict validation
    if (!name || name.trim().length < 2) return res.status(400).json({ message: 'Name must be at least 2 characters.' });
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Valid email is required.' });
    if (!['Morning', 'Afternoon', 'Evening'].includes(timeSlot)) return res.status(400).json({ message: 'Select a valid time slot.' });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ message: 'Date must be YYYY-MM-DD.' });
    if (!['house-cleaning', 'ac-repair', 'plumbing', 'electrical'].includes(serviceSlug)) return res.status(400).json({ message: 'Invalid service slug.' });
    if (!address || address.trim().length === 0) return res.status(400).json({ message: 'Address is required via Map.' });

    const selectedDate = new Date(date + 'T00:00:00');
    const today = new Date();
    today.setHours(0,0,0,0);
    if (selectedDate < today) return res.status(400).json({ message: 'Cannot book a date in the past.' });

    if (notes && notes.length > 500) return res.status(400).json({ message: 'Notes exceed 500 characters.' });

    const booking = new Booking({
      user: req.userId,
      serviceSlug,
      serviceName,
      name: name.trim(),
      email: email.trim(),
      date,
      timeSlot,
      notes: notes ? notes.trim() : '',
      address: address.trim(),
      lat,
      lng
    });

    await booking.save();
    res.status(201).json(booking);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages[0] });
    }
    res.status(500).json({ message: 'Error creating booking' });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bookings' });
  }
});
/**
 * GET all bookings - ONLY for Admin (email: admin@gmail.com)
 */
router.get('/all', protect, async (req, res) => {
  try {
    // Note: To make this robust, you'd check the User model's role
    // For this specific request, checking the active user's identity suffices
    const User = (await import('../models/User.js')).default;
    const adminUser = await User.findById(req.userId);
    
    if (adminUser?.email !== 'admin@gmail.com') {
      return res.status(403).json({ message: 'Forbidden: Admin access only' });
    }

    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching all bookings' });
  }
});

/**
 * PATCH to assign a worker - ONLY for Admin
 */
router.patch('/:id/assign', protect, async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    const adminUser = await User.findById(req.userId);
    
    if (adminUser?.email !== 'admin@gmail.com') {
      return res.status(403).json({ message: 'Forbidden: Admin access only' });
    }

    const { workerName } = req.body;
    if (!workerName) return res.status(400).json({ message: 'Worker name is required.' });

    const booking = await Booking.findByIdAndUpdate(
      req.params.id, 
      { assignedWorker: workerName }, 
      { new: true }
    );

    if (!booking) return res.status(404).json({ message: 'Booking not found.' });
    
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Error assigning worker.' });
  }
});

/**
 * PATCH to update booking amount - ONLY for Admin
 */
router.patch('/:id/amount', protect, async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    const adminUser = await User.findById(req.userId);
    
    if (adminUser?.email !== 'admin@gmail.com') {
      return res.status(403).json({ message: 'Forbidden: Admin access only' });
    }

    const { amount } = req.body;
    if (amount === undefined || isNaN(amount)) return res.status(400).json({ message: 'Valid amount is required.' });

    const booking = await Booking.findByIdAndUpdate(
      req.params.id, 
      { totalAmount: Number(amount) }, 
      { new: true }
    );

    if (!booking) return res.status(404).json({ message: 'Booking not found.' });
    
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Error updating amount.' });
  }
});

/**
 * POST to explicitly notify user - ONLY for Admin
 */
router.post('/:id/notify', protect, async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    const adminUser = await User.findById(req.userId);
    
    if (adminUser?.email !== 'admin@gmail.com') {
      return res.status(403).json({ message: 'Forbidden: Admin access only' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });

    // Notify User via Email
    const emailSubject = `Update for your ${booking.serviceName} Booking`;
    const emailBody = `
      <h1>Booking Update from ServiceHub</h1>
      <p>Hello ${booking.name},</p>
      <p>We have updated the details for your upcoming <strong>${booking.serviceName}</strong> service.</p>
      <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; border: 1px solid #ddd; color: #333;">
        <p><strong>Service:</strong> ${booking.serviceName}</p>
        <p><strong>Date:</strong> ${booking.date}</p>
        <p><strong>Time Slot:</strong> ${booking.timeSlot}</p>
        <p><strong>Assigned Worker:</strong> ${booking.assignedWorker || 'Pending'}</p>
        <p><strong>Total Amount:</strong> Rs. ${booking.totalAmount.toLocaleString()}</p>
        <p><strong>Service Location:</strong> ${booking.address}</p>
      </div>
      <p>Thank you for choosing ServiceHub!</p>
    `;

    if(process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await sendEmail(booking.email, emailSubject, `Your booking for ${booking.serviceName} has been updated.`, emailBody);
      res.json({ message: 'Notification sent successfully' });
    } else {
      res.status(500).json({ message: 'Email credentials missing in server config' });
    }

  } catch (error) {
    res.status(500).json({ message: 'Error sending notification.' });
  }
});

export default router;
