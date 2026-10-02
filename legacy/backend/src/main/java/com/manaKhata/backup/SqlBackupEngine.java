package com.manaKhata.backup;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.io.File;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class SqlBackupEngine {

    private final JdbcTemplate jdbcTemplate;
    private final Environment env;

    public void createSqlBackup(String backupDir) {
        log.info("Starting SQL backup generation...");
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String filePath = backupDir + "/manaKhata_backup_" + timestamp + ".sql";

        try {
            // Check if we are running on H2
            String driver = env.getProperty("spring.datasource.driver-class-name", "");
            if (driver.contains("h2")) {
                // H2 specific SQL dump command
                String sql = String.format("SCRIPT TO '%s'", new File(filePath).getAbsolutePath());
                jdbcTemplate.execute(sql);
                log.info("H2 SQL backup generated successfully at {}", filePath);
            } else if (driver.contains("mysql")) {
                // MySQL specific dump via runtime (requires mysqldump installed on server)
                // This is a basic implementation for MySQL. In enterprise production, typically RDS/Cloud SQL handles this.
                log.warn("MySQL database detected. For MySQL, it is recommended to use native crontab mysqldump or AWS RDS backups.");
            } else {
                log.warn("Unsupported database dialect for native SQL dump.");
            }
        } catch (Exception e) {
            log.error("Failed to generate SQL backup: {}", e.getMessage(), e);
        }
    }
}
