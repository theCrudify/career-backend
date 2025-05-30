import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import dotenv from "dotenv";
import { db } from "../../../utils/db";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = process.env.JWT_EXPIRATION;

if (!JWT_SECRET) {
    throw new Error("❌ JWT_SECRET is not defined in environment variables!");
}
if (!JWT_EXPIRATION) {
    throw new Error("❌ JWT_EXPIRATION is not defined in environment variables!");
}

// Tipe data sementara untuk user, bisa disesuaikan
type UserType = {
    user_id: number;
    username: string | null;
    email: string | null;
    password?: string | null; // Password mungkin null jika dari bypass
    employee_code: string;
    employee_name: string | null;
} | null;


const parsedExpiration: SignOptions["expiresIn"] = /^\d+$/.test(JWT_EXPIRATION)
    ? Number(JWT_EXPIRATION)
    : (JWT_EXPIRATION as SignOptions["expiresIn"]);

const loginAttempts = new Map<string, { count: number; timer?: NodeJS.Timeout; blockUntil?: number }>();

export const loginuserRISE = async (req: Request, res: Response): Promise<void> => {
    try {
        const { uname, username: empCode, password } = req.body;
        const key = empCode || uname;

        // --- Blokir sementara ---
        if (loginAttempts.get(key)?.blockUntil && Date.now() < loginAttempts.get(key)!.blockUntil!) {
            console.warn(`⚠️ User ${key} is blocked due to excessive login attempts.`);
            res.status(429).json({ error: "Too Many Attempts", details: "Your account is temporarily blocked. Please try again later." });
            return;
        }

        // --- Validasi input ---
        if (!empCode && !uname) {
            console.warn("⚠️ Missing required fields: 'uname' or 'username'");
            res.status(400).json({ error: "Employee code or username is required", details: "Both 'uname' and 'username' (employee code) are missing." });
            return;
        }

        // --- Pencarian User Tahap 1: Exact Match ---
        let user: UserType = await db.mst_employeeaio_login.findFirst({
            where: {
                // Cari berdasarkan employee_code jika ada, ATAU username jika ada
                OR: [
                    empCode ? { employee_code: empCode } : {},
                    uname ? { username: uname } : {}
                ].filter(c => Object.keys(c).length > 0), // Filter objek kosong jika salah satu tidak ada
                is_deleted: false,
            },
            select: { user_id: true, username: true, email: true, password: true, employee_code: true, employee_name: true },
        });

        // --- Pencarian User Tahap 2: Flexible Employee Code (Padding) ---
        if (!user && empCode && empCode.length > 0 && empCode.length < 5) {
            const paddedCode = empCode.padStart(5, '0'); // Tambahkan '0' di depan hingga 5 digit
            console.log(`ℹ️ User not found with exact code '${empCode}'. Trying padded code: '${paddedCode}'`);

            const potentialUser = await db.mst_employeeaio_login.findFirst({
                where: {
                    employee_code: paddedCode, // Cari HANYA dengan kode yang sudah di-padding
                    is_deleted: false,
                },
                select: { user_id: true, username: true, email: true, password: true, employee_code: true, employee_name: true },
            });

            if (potentialUser) {
                // Validasi aturan khusus: Jika kode di DB mulai '00' dan input TIDAK mulai '0', tolak.
                if (potentialUser.employee_code.startsWith('00') && !empCode.startsWith('0')) {
                    console.warn(`⚠️ Found user with padded code '${paddedCode}', but original input '${empCode}' is invalid for a code starting with '00'. Rejecting.`);
                    // JANGAN set `user = potentialUser`, biarkan `user` tetap null.
                }
                // Pastikan user yang ditemukan via padding memang 5 digit dan berawalan 0
                else if (potentialUser.employee_code.length === 5 && potentialUser.employee_code.startsWith('0')) {
                    console.log(`✅ Found user using padded code '${paddedCode}' from input '${empCode}'. Accepting.`);
                    user = potentialUser; // Terima user yang ditemukan ini
                } else {
                    console.log(`ℹ️ Found user with padded code '${paddedCode}', but the stored code is not 5 digits starting with '0'. Ignoring.`);
                    // Abaikan user ini jika tidak sesuai kriteria
                }
            } else {
                console.log(`ℹ️ Padded code '${paddedCode}' also not found.`);
            }
        }

        // --- Penanganan login bypass "demo" ---
        if (password === "demo") {
            if (!user) {
                console.log("⚠️ Bypass login triggered for demo user (user not found initially):", uname || empCode);
                user = {
                    user_id: 0,
                    username: uname || empCode,
                    email: "bypass@example.com",
                    employee_code: empCode || uname, // Gunakan input asli
                    employee_name: "Bypass User",
                    password: "",
                };
            } else {
                console.log(`ℹ️ Bypass login triggered for existing user: ${user.employee_code}`);
            }
        }

        // --- User tidak ditemukan (setelah semua cara & bypass) ---
        if (!user) {
            handleFailedLogin(key);
            console.warn(`⚠️ User Not Found: ${key} (after exact match, padding attempt, and bypass check)`);
            res.status(404).json({ error: "User Not Found", details: "User not found with provided credentials or matching criteria." });
            return;
        }

        // --- Persiapkan format employee code untuk pencarian otorisasi ---
        let authEmployeeCode = user.employee_code; // Default (misalnya "00172")
        let alternativeEmployeeCode = user.employee_code;

        // Jika kode diawali dengan "0", coba versi dengan leading zero yang lebih sedikit
// --- Persiapkan format employee code untuk pencarian otorisasi ---
// Create an array of all possible formats of the employee code
const possibleEmployeeCodes = [];

// Original code as-is
possibleEmployeeCodes.push(user.employee_code);

// Version with one leading zero
if (user.employee_code.startsWith('0')) {
    const oneLeadingZero = user.employee_code.replace(/^0+/, '0');
    possibleEmployeeCodes.push(oneLeadingZero);
}

// Version with no leading zeros
const noLeadingZeros = user.employee_code.replace(/^0+/, '');
possibleEmployeeCodes.push(noLeadingZeros);

// Version with two leading zeros (if original had one)
if (user.employee_code.startsWith('0') && !user.employee_code.startsWith('00')) {
    const twoLeadingZeros = '0' + user.employee_code;
    possibleEmployeeCodes.push(twoLeadingZeros);
}

// Log all versions we're going to try
console.log(`ℹ️ Trying all possible employee code formats:`, possibleEmployeeCodes);

// --- Cari data otorisasi dengan semua kemungkinan format kode employee ---
const auth = await db.mst_authorization.findFirst({
    where: { 
        OR: possibleEmployeeCodes.map(code => ({ employee_code: code })),
        employee_name: user.employee_name 
    },
    select: {
        id: true,
        employee_name: true,
        employee_code: true,
        email: true,
        profile_pic: true,
        no_hp: true,
        site: true,
        company: true,
        department: true,
        role: true,
        created_at: true
    }
});

        // --- Otorisasi tidak ditemukan ---
        if (!auth) {
            if (password === "demo" && user.user_id === 0) {
                console.warn(`⚠️ Authorization data missing for DEMO user: ${user.employee_code}. Provide default auth if needed.`);
            }

            handleFailedLogin(key);
            console.warn(`⚠️ Authorization data missing for user: ${user.employee_code}`);
            res.status(404).json({ error: "Authorization Not Found", details: "Authorization data not found for the user." });
            return;
        }

        // --- Validasi password ---
        let isPasswordValid = false;
        if (password === "demo") {
            isPasswordValid = true; // Bypass password check
        } else if (user.password) {
            isPasswordValid = await bcrypt.compare(password, user.password);
        }

        if (!isPasswordValid) {
            handleFailedLogin(key);
            console.warn(`⚠️ Invalid Credentials for user: ${user.employee_code}`);
            res.status(401).json({ error: "Invalid Credentials", details: "Incorrect password." });
            return;
        }

        // --- Reset percobaan login jika berhasil ---
        resetLoginAttempts(key);

        // --- Ambil data tambahan: department, site, dan company names ---
        // Convert string to number with fallback
        const departmentId = Number(auth.department) || 0;
        const siteId = Number(auth.site) || 0;
        const companyId = Number(auth.company) || 0;

        // Fetch department name
        const departmentData = await db.mst_department.findUnique({
            where: { id: departmentId },
            select: { department: true }
        });

        // Fetch site name
        const siteData = await db.mst_site.findUnique({
            where: { id: siteId },
            select: { site_description: true }
        });

        // Fetch company name
        const companyData = await db.mst_company.findUnique({
            where: { id: companyId },
            select: { company: true }
        });

        // --- Buat JWT Token sesuai dengan data yang ada ---
        const token = jwt.sign(
            {
                auth_id: auth.id,
                nik: user.employee_code,
                name: user.employee_name,
                email: user.email || auth.email,
                role: auth.role,
                department: auth.department,
                site: auth.site,
                company: auth.company
            },
            JWT_SECRET,
            { expiresIn: parsedExpiration }
        );

        // --- Set Cookie ---
        res.cookie("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: convertExpirationToMs(JWT_EXPIRATION)
        });

        // --- Kirim Respons Sukses ---
        console.log(`✅ Login successful: ${user.employee_code}`);
        res.status(200).json({
            data: {
                auth_id: auth.id,
                nik: user.employee_code,
                name: user.employee_name,
                email: user.email || auth.email,
                role: auth.role,
                department: auth.department,
                department_name: departmentData?.department || null,
                site: auth.site,
                site_name: siteData?.site_description || null,
                company: auth.company,
                company_name: companyData?.company || null,
                profile_pic: auth.profile_pic,
                phone: auth.no_hp
            },
            token: token,
        });

    } catch (error: any) {
        console.error("❌ Login error:", error.message, error.stack);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

const convertExpirationToMs = (expiration: string): number => {
    try {
        const match = expiration.match(/^(\d+)([smhd])$/);
        if (!match) throw new Error("❌ Invalid JWT_EXPIRATION format!");

        const value = parseInt(match[1]);
        const unit = match[2];

        switch (unit) {
            case "s": return value * 1000;
            case "m": return value * 60 * 1000;
            case "h": return value * 60 * 60 * 1000;
            case "d": return value * 24 * 60 * 60 * 1000;
            default: throw new Error("❌ Invalid JWT_EXPIRATION format!");
        }
    } catch (error: any) {
        console.error("❌ Expiration Conversion Error:", error.message);
        throw error;
    }
};

const handleFailedLogin = (key: string) => {
    const attempt = loginAttempts.get(key) || { count: 0 };
    attempt.count += 1;
    loginAttempts.set(key, attempt);

    if (attempt.count >= 5 && !attempt.blockUntil) {
        attempt.blockUntil = Date.now() + 15 * 60 * 1000;
        console.warn(`⚠️ User ${key} exceeded login attempts. Blocked until ${new Date(attempt.blockUntil).toLocaleString()}`);
        attempt.timer = setTimeout(() => {
            attempt.count = 0;
            attempt.blockUntil = undefined;
            loginAttempts.set(key, attempt);
            console.log(`ℹ️ User ${key} login attempts unblocked.`);
        }, 15 * 60 * 1000);
        loginAttempts.set(key, attempt);
    }
};

const resetLoginAttempts = (key: string) => {
    const attempt = loginAttempts.get(key);
    if (attempt?.timer) clearTimeout(attempt.timer);
    loginAttempts.delete(key);
};