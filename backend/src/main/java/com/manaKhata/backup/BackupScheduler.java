package com.manaKhata.backup;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class BackupScheduler {

    private final BackupService backupService;

    // Run backup every day at 2:00 AM server time
    @Scheduled(cron = "0 0 2 * * ?")
    public void scheduleDailyBackup() {
        log.info("Scheduled trigger: Executing daily automated backup");
        backupService.executeFullBackup();
    }
}
