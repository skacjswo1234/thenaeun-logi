-- 문의 테이블 생성
CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    age INTEGER,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'new' CHECK(status IN ('new', 'read', 'replied')),
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 인덱스 생성 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at DESC);

