CREATE TABLE IF NOT EXISTS subscribers (
	email TEXT PRIMARY KEY,
	token TEXT NOT NULL UNIQUE,
	status TEXT NOT NULL, -- pending | confirmed
	created_at INTEGER NOT NULL,
	confirm_sent_at INTEGER NOT NULL,
	confirmed_at INTEGER,
	theme TEXT -- light | dark, the site theme at sign-up, so our pages match it
);

-- One row per post per subscriber, so a retried run never mails anyone twice
CREATE TABLE IF NOT EXISTS deliveries (
	post_id TEXT NOT NULL,
	email TEXT NOT NULL,
	sent_at INTEGER NOT NULL,
	PRIMARY KEY (post_id, email)
);
