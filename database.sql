CREATE DATABASE IF NOT EXISTS monolife_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE monolife_db;

-- Akun pengguna. password disimpan sebagai hash bcrypt.
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(30) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Pemasukan & pengeluaran.
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    note VARCHAR(255) NULL,
    trx_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_trx_user_date (user_id, trx_date),
    CONSTRAINT fk_trx_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Target / kebiasaan (habit tracker).
-- title        : nama kebiasaan, mis. "Olahraga 30 menit"
-- goal         : tujuan di baliknya, mis. "Badan lebih sehat"
-- weekly_target: berapa kali per minggu ingin dilakukan (1-7)
-- target_date  : batas waktu opsional
CREATE TABLE IF NOT EXISTS habits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    goal VARCHAR(255) NULL,
    weekly_target TINYINT UNSIGNED NOT NULL DEFAULT 7,
    target_date DATE NULL,
    archived TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_habit_user (user_id),
    CONSTRAINT fk_habit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Catatan harian: satu baris = satu kebiasaan selesai pada satu tanggal.
CREATE TABLE IF NOT EXISTS habit_logs (
    habit_id INT NOT NULL,
    user_id INT NOT NULL,
    log_date DATE NOT NULL,
    PRIMARY KEY (habit_id, log_date),
    INDEX idx_log_user_date (user_id, log_date),
    CONSTRAINT fk_log_habit FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabel `sessions` dibuat otomatis oleh express-mysql-session saat backend pertama kali jalan.
