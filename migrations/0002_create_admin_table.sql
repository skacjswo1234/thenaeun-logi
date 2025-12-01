-- 관리자 테이블 생성
CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE DEFAULT 'admin',
    password TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 기본 관리자 계정 생성 (비밀번호: admin123)
-- 실제 배포 시 비밀번호를 변경하세요
INSERT OR IGNORE INTO admin (username, password) 
VALUES ('admin', '1234');

