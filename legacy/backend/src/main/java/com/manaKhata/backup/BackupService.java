package com.manaKhata.backup;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.File;

@Slf4j
@Service
@RequiredArgsConstructor
public class BackupService {

    private final JsonBackupEngine jsonBackupEngine;
    private final ExcelBackupEngine excelBackupEngine;
    private final SqlBackupEngine sqlBackupEngine;

    private static final String BACKUP_DIR = "backups";

    public void executeFullBackup() {
        log.info("Initiating full multi-layer backup process...");
        ensureBackupDirectoryExists();

        try {
            // Execute backups simultaneously or sequentially
            jsonBackupEngine.createJsonBackup(BACKUP_DIR);
            excelBackupEngine.createExcelBackup(BACKUP_DIR);
            sqlBackupEngine.createSqlBackup(BACKUP_DIR);
            
            log.info("Full multi-layer backup process completed successfully.");
        } catch (Exception e) {
            log.error("Error during full backup process: {}", e.getMessage(), e);
        }
    }

    private void ensureBackupDirectoryExists() {
        File dir = new File(BACKUP_DIR);
        if (!dir.exists()) {
            boolean created = dir.mkdirs();
            if (created) {
                log.info("Created backup directory: {}", dir.getAbsolutePath());
            } else {
                log.error("Failed to create backup directory: {}", dir.getAbsolutePath());
            }
        }
    }

    @org.springframework.context.event.EventListener
    @org.springframework.scheduling.annotation.Async
    public void handleDataChangedEvent(DataChangedEvent event) {
        log.info("Critical transaction detected ({} - {}). Triggering auto-backup...", event.getEntityType(), event.getAction());
        executeFullBackup();
    }
}
