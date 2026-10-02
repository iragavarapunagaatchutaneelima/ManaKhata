CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    version BIGINT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS households (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    version BIGINT,
    name VARCHAR(255) NOT NULL,
    created_by_id BIGINT,
    CONSTRAINT fk_household_user FOREIGN KEY (created_by_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS expenses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    version BIGINT,
    amount DOUBLE NOT NULL,
    category VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    expense_date DATE NOT NULL,
    household_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    CONSTRAINT fk_expense_household FOREIGN KEY (household_id) REFERENCES households (id),
    CONSTRAINT fk_expense_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS budgets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    version BIGINT,
    budget_type VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    current_spent DOUBLE,
    is_active BOOLEAN NOT NULL,
    month INT NOT NULL,
    monthly_limit DOUBLE NOT NULL,
    year INT NOT NULL,
    household_id BIGINT,
    user_id BIGINT,
    CONSTRAINT fk_budget_household FOREIGN KEY (household_id) REFERENCES households (id),
    CONSTRAINT fk_budget_user FOREIGN KEY (user_id) REFERENCES users (id)
);
