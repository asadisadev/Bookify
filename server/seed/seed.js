/**
 * Queue Pilot — Database Seed Script
 *
 * Usage:   npm run seed
 *
 * What it does
 * ─────────────────────────────────────────────────────────────────────────────
 *  1. Clears all existing Appointments, Users, and Organizations
 *  2. Creates 1 Admin
 *  3. Creates 5 Organizations (all approved)
 *  4. Creates 10 Professionals (all approved, spread across orgs)
 *  5. Creates 20 Customers
 *  6. Creates 80 Appointments for today with sequential tokens,
 *     mixed statuses, and structured QR payloads
 */

import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dns from "node:dns";

import User         from "../models/User.js";
import Organization from "../models/Organization.js";
import Appointment  from "../models/Appointment.js";
import { generateQRPayload } from "../utils/qrGenerator.js";

// ── Use reliable DNS servers (same as db.js) ─────────────────────────────────
dns.setServers(["8.8.8.8", "1.1.1.1"]);

// ── Connect ───────────────────────────────────────────────────────────────────
await mongoose.connect(process.env.MONGO_URI);
console.log("✅ MongoDB Connected");

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const pick   = (arr) => arr[Math.floor(Math.random() * arr.length)];
const range  = (n)   => Array.from({ length: n }, (_, i) => i);
const today  = new Date();
const todayUTC = new Date(Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
    0, 0, 0, 0
));

const hashPwd = async (plain) => bcrypt.hash(plain, 10);

// ─────────────────────────────────────────────────────────────────────────────
// 1.  Clear existing data
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n🗑  Clearing existing data…");
await Promise.all([
    Appointment.deleteMany({}),
    User.deleteMany({}),
    Organization.deleteMany({})
]);
console.log("   Done.");

// ─────────────────────────────────────────────────────────────────────────────
// 2.  Admin
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n👤 Creating Admin…");
const admin = await User.create({
    name:       "Super Admin",
    email:      "admin@queuepilot.com",
    password:   await hashPwd("123456"),
    phone:      "+92-300-0000001",
    role:       "Admin",
    isApproved: true
});
console.log(`   Admin created: ${admin.email}`);

// ─────────────────────────────────────────────────────────────────────────────
// 3.  Organizations
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n🏢 Creating Organizations…");
const orgData = [
    {
        name:        "Indus Hospital",
        category:    "Healthcare",
        address:     "Korangi Industrial Area",
        city:        "Karachi",
        phone:       "+92-21-35101000",
        email:       "info@indushospital.org.pk",
        description: "Pakistan's largest free-of-cost hospital network.",
        isApproved:  true
    },
    {
        name:        "Meezan Bank",
        category:    "Banking",
        address:     "PNSC Building, M.T. Khan Road",
        city:        "Karachi",
        phone:       "+92-21-111-331-331",
        email:       "info@meezanbank.com",
        description: "Pakistan's first and largest Islamic commercial bank.",
        isApproved:  true
    },
    {
        name:        "NADRA",
        category:    "Government",
        address:     "G-5, Constitution Avenue",
        city:        "Islamabad",
        phone:       "+92-51-111-786-100",
        email:       "help@nadra.gov.pk",
        description: "National Database and Registration Authority.",
        isApproved:  true
    },
    {
        name:        "ABC Dental Clinic",
        category:    "Healthcare",
        address:     "Model Town",
        city:        "Lahore",
        phone:       "+92-42-35761234",
        email:       "contact@abcdental.pk",
        description: "Comprehensive dental care for the whole family.",
        isApproved:  true
    },
    {
        name:        "City Lab",
        category:    "Diagnostics",
        address:     "Blue Area, Jinnah Avenue",
        city:        "Islamabad",
        phone:       "+92-51-2800100",
        email:       "info@citylab.pk",
        description: "Fully automated diagnostic and pathology lab.",
        isApproved:  true
    }
];

const orgs = await Organization.insertMany(
    orgData.map((o) => ({ ...o, createdBy: admin._id }))
);
orgs.forEach((o) => console.log(`   ${o.name}`));

// ─────────────────────────────────────────────────────────────────────────────
// 4.  Professionals (10)
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n🩺 Creating Professionals…");

const professionalData = [
    // Indus Hospital — 2 Doctors
    {
        name: "Dr. Ayesha Khan",         profession: "Doctor",         specialization: "General Medicine",
        appointmentFee: 1500, averageServiceTime: 15,
        organization: orgs[0]._id,
        workingHours: { start: "09:00", end: "17:00" }
    },
    {
        name: "Dr. Bilal Ahmed",          profession: "Doctor",         specialization: "Cardiology",
        appointmentFee: 3000, averageServiceTime: 20,
        organization: orgs[0]._id,
        workingHours: { start: "10:00", end: "18:00" }
    },
    // Meezan Bank — 2 Bank Officers
    {
        name: "Omar Farooq",              profession: "Bank Officer",   specialization: "Account Opening",
        appointmentFee: 0,    averageServiceTime: 10,
        organization: orgs[1]._id,
        workingHours: { start: "09:00", end: "16:00" }
    },
    {
        name: "Sara Malik",               profession: "Bank Officer",   specialization: "Loan Department",
        appointmentFee: 0,    averageServiceTime: 15,
        organization: orgs[1]._id,
        workingHours: { start: "09:00", end: "16:00" }
    },
    // NADRA — 2 Managers
    {
        name: "Hamza Qureshi",            profession: "NADRA Officer",  specialization: "CNIC Issuance",
        appointmentFee: 0,    averageServiceTime: 12,
        organization: orgs[2]._id,
        workingHours: { start: "08:00", end: "14:00" }
    },
    {
        name: "Nadia Hussain",            profession: "NADRA Officer",  specialization: "Smart Card",
        appointmentFee: 0,    averageServiceTime: 12,
        organization: orgs[2]._id,
        workingHours: { start: "08:00", end: "14:00" }
    },
    // ABC Dental Clinic — 2 Dentists
    {
        name: "Dr. Zara Siddiqui",        profession: "Dentist",        specialization: "Orthodontics",
        appointmentFee: 2000, averageServiceTime: 30,
        organization: orgs[3]._id,
        workingHours: { start: "10:00", end: "19:00" }
    },
    {
        name: "Dr. Usman Tariq",          profession: "Dentist",        specialization: "Oral Surgery",
        appointmentFee: 2500, averageServiceTime: 45,
        organization: orgs[3]._id,
        workingHours: { start: "09:00", end: "17:00" }
    },
    // City Lab — 2 Lab Specialists
    {
        name: "Farhan Mirza",             profession: "Lab Specialist",  specialization: "Haematology",
        appointmentFee: 500,  averageServiceTime: 10,
        organization: orgs[4]._id,
        workingHours: { start: "07:00", end: "15:00" }
    },
    {
        name: "Amna Iqbal",               profession: "Lab Specialist",  specialization: "Biochemistry",
        appointmentFee: 500,  averageServiceTime: 10,
        organization: orgs[4]._id,
        workingHours: { start: "07:00", end: "15:00" }
    }
];

const profPwd = await hashPwd("123456");
const professionals = await User.insertMany(
    professionalData.map((p, i) => ({
        ...p,
        email:      `prof${i + 1}@queuepilot.com`,
        password:   profPwd,
        phone:      `+92-300-100000${i + 1}`,
        role:       "Professional",
        isApproved: true,
        workingDays: ["Monday","Tuesday","Wednesday","Thursday","Friday"]
    }))
);
professionals.forEach((p) => console.log(`   ${p.name} — ${p.profession}`));

// ─────────────────────────────────────────────────────────────────────────────
// 5.  Customers (20)
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n👥 Creating Customers…");

const customerNames = [
    "Ali Hassan",      "Fatima Zahra",    "Muhammad Usman",  "Sana Tariq",
    "Imran Butt",      "Hira Noor",       "Waseem Akram",    "Zainab Sheikh",
    "Tariq Mahmood",   "Maria Khalid",    "Arsalan Raza",    "Rabia Aslam",
    "Junaid Akhtar",   "Noor ul Ain",     "Shoaib Rizvi",    "Kiran Aziz",
    "Danish Siddiqui", "Annum Baig",      "Faizan Mirza",    "Samia Nawaz"
];

const custPwd = await hashPwd("123456");
const customers = await User.insertMany(
    customerNames.map((name, i) => ({
        name,
        email:      `customer${i + 1}@queuepilot.com`,
        password:   custPwd,
        phone:      `+92-300-200000${(i + 1).toString().padStart(2, "0")}`,
        role:       "Customer",
        isApproved: true
    }))
);
console.log(`   ${customers.length} customers created.`);

// ─────────────────────────────────────────────────────────────────────────────
// 6.  Appointments (80)
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n📅 Creating Appointments…");

const SLOTS         = ["Morning", "Afternoon", "Evening"];
// Weighted distribution to generate realistic dashboard numbers
const STATUS_POOL   = [
    "Booked",    "Booked",    "Booked",    "Booked",
    "CheckedIn", "CheckedIn",
    "Completed", "Completed", "Completed", "Completed",
    "Cancelled"
];

/**
 * Track per-(professional + slot) token counters so each combination
 * gets sequential tokens starting from 1.
 */
const tokenCounters = {};
const getNextToken = (professionalId, slot) => {
    const key = `${professionalId}_${slot}`;
    tokenCounters[key] = (tokenCounters[key] ?? 0) + 1;
    return tokenCounters[key];
};

const appointmentDocs = [];

for (let i = 0; i < 80; i++) {
    const customer     = pick(customers);
    const professional = pick(professionals);
    const slot         = pick(SLOTS);
    const status       = pick(STATUS_POOL);
    const tokenNumber  = getNextToken(professional._id.toString(), slot);

    // Use a temporary ObjectId as the appointment _id so the QR payload
    // can reference it before insertion
    const appointmentId = new mongoose.Types.ObjectId();

    const qrCode = generateQRPayload({
        appointmentId:  appointmentId.toString(),
        customerId:     customer._id.toString(),
        professionalId: professional._id.toString(),
        date:           todayUTC
    });

    appointmentDocs.push({
        _id:             appointmentId,
        customer:        customer._id,
        professional:    professional._id,
        organization:    professional.organization,
        appointmentDate: todayUTC,
        slot,
        tokenNumber,
        status,
        paymentStatus:   status === "Completed" ? "Paid" : "Pending",
        paymentAmount:   status === "Completed" ? professional.appointmentFee : 0,
        checkedIn:       ["CheckedIn", "Completed"].includes(status),
        qrCode
    });
}

await Appointment.insertMany(appointmentDocs);
console.log(`   ${appointmentDocs.length} appointments created.`);

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
const statusSummary = appointmentDocs.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
}, {});

console.log("\n✅ Seeding complete!\n");
console.log("─── Seed Summary ───────────────────────────────────");
console.log(`   Admin:         1`);
console.log(`   Organizations: ${orgs.length}`);
console.log(`   Professionals: ${professionals.length}`);
console.log(`   Customers:     ${customers.length}`);
console.log(`   Appointments:  ${appointmentDocs.length}`);
console.log("   Appointment statuses breakdown:");
Object.entries(statusSummary).forEach(([s, c]) => console.log(`     • ${s.padEnd(12)} ${c}`));
console.log("────────────────────────────────────────────────────");
console.log("\n🔑 Login credentials:");
console.log("   Admin        →  admin@queuepilot.com  /  123456");
console.log("   Professionals→  prof1@queuepilot.com … prof10@queuepilot.com  /  123456");
console.log("   Customers    →  customer1@queuepilot.com … customer20@queuepilot.com  /  123456");
console.log("");

await mongoose.disconnect();
process.exit(0);
