# 📚 Library Management System

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18-green?logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4-gray?logo=express)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8-orange?logo=mysql)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

> **Sistem Manajemen Perpustakaan Modern** dengan fitur perhitungan denda otomatis, laporan statistik interaktif, dan export multi-format (Excel & PDF). Dibangun dengan arsitektur full-stack yang scalable dan production-ready.

---

## 📋 Daftar Isi

- [Tentang Project](#-tentang-project)
- [Fitur Unggulan](#-fitur-unggulan)
- [Tech Stack](#-tech-stack)
- [Preview](#-preview)
- [Instalasi](#-instalasi)
- [Struktur Database](#-struktur-database)
- [API Documentation](#-api-documentation)
- [Struktur Folder](#-struktur-folder)
- [Key Features](#-key-features)
- [Screenshots](#-screenshots)
- [Development](#-development)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact](#-contact)

---

## 🎯 Tentang Project

**Library Management System** adalah aplikasi web full-stack yang dirancang untuk mengelola operasional perpustakaan secara digital dan efisien. Sistem ini mengintegrasikan manajemen buku, anggota, transaksi peminjaman/pengembalian dengan **sistem denda otomatis**, serta menyediakan **laporan analitik** yang komprehensif untuk pengambilan keputusan.

### 🎯 Tujuan Project

- ✅ Digitalisasi proses manajemen perpustakaan
- ✅ Otomatisasi perhitungan denda keterlambatan
- ✅ Penyediaan laporan statistik real-time
- ✅ User experience yang intuitif dan responsive
- ✅ Arsitektur yang scalable dan maintainable

---

## ✨ Fitur Unggulan

### 📖 Manajemen Buku

- CRUD operasi buku dengan validasi data
- Tracking stok real-time
- Pencarian dan filtering advanced
- Kategori dan klasifikasi buku

### 👥 Manajemen Anggota

- Database anggota terpusat
- Riwayat peminjaman per anggota
- Validasi data anggota

### 📝 Transaksi Peminjaman

- **Multi-book borrowing**: Pinjam beberapa buku dalam satu transaksi
- **Stock validation**: Validasi stok otomatis sebelum peminjaman
- **Date validation**: Validasi tanggal jatuh tempo

### 💰 Sistem Denda Otomatis _(Feature Highlight)_

- **Auto-calculation**: Perhitungan denda real-time (Rp 1.000/buku/hari)
- **Estimation preview**: Tampilkan estimasi denda sebelum konfirmasi
- **Database storage**: Penyimpanan denda per item (`fine_amount`)
- **Condition assessment**: Penilaian kondisi buku (Baik/Rusak/Hilang)
- **Auto stock update**: Update stok otomatis saat pengembalian

### 📊 Laporan & Statistik

- **Period filtering**: Mingguan, Bulanan, Tahunan, Custom range
- **Interactive charts**:
  - Line chart: Tren peminjaman & pengembalian
  - Bar chart: Grafik denda harian
- **Top rankings**:
  - 5 Buku terpopuler
  - 5 Member paling aktif
- **Summary statistics**: Total transaksi, pengembalian, denda

### 📥 Export Multi-Format

- **Excel (.xlsx)**:
  - Multi-sheet dengan formatting profesional
  - Summary, Top Books, Top Members
- **PDF**:
  - Layout profesional dengan header & summary box
  - Auto-generated dengan timestamp

### 🔐 Autentikasi & Keamanan

- JWT-based authentication
- Protected API routes
- Password hashing dengan bcrypt
- Rate limiting untuk security
- CORS configuration

---

## 🛠️ Tech Stack

### **Frontend**

<div align="left">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/React_Hook_Form-EC5990?style=for-the-badge&logo=reacthookform&logoColor=white" alt="React Hook Form" />
  <img src="https://img.shields.io/badge/Zod-3E53C0?style=for-the-badge&logo=zod&logoColor=white" alt="Zod" />
  <img src="https://img.shields.io/badge/Recharts-18181B?style=for-the-badge&logo=recharts&logoColor=white" alt="Recharts" />
  <img src="https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white" alt="Axios" />
</div>

### **Backend**

<div align="left">
  <img src="https://img.shields.io/badge/Node.js-18-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-4-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js" />
  <img src="https://img.shields.io/badge/MySQL-8-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT" />
</div>

### **Tools & Libraries**

- **Excel Export**: XLSX
- **PDF Generation**: jsPDF + jspdf-autotable
- **Icons**: React Icons (Feather Icons)
- **Security**: Helmet, CORS, Express Rate Limit
- **Validation**: Zod schema validation

---

## 📸 Preview

### Dashboard & Reports

![Reports Page](./screenshots/reports.png)
_Halaman laporan dengan grafik interaktif dan statistik real-time_

### Transaction Management

![Return with Fine](./screenshots/return-fine.png)
_Form pengembalian dengan estimasi denda otomatis_

### Export Features

![Export Excel/PDF](./screenshots/export.png)
_Export laporan dalam format Excel dan PDF_

---

## 📦 Instalasi

### **Prerequisites**

Pastikan sudah terinstall:

- Node.js >= 18.x
- MySQL >= 8.x
- npm/yarn

### **Langkah Instalasi**

1. **Clone repository**

```bash
git clone https://github.com/yourusername/library-management-system.git
cd library-management-system
```
