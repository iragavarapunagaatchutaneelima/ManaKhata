package com.manaKhata.backup;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.manaKhata.expense.ExpenseRepository;
import com.manaKhata.household.HouseholdRepository;
import com.manaKhata.reimbursement.ReimbursementRepository;
import com.manaKhata.asset.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.File;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class JsonBackupEngine {

    private final ExpenseRepository expenseRepository;
    private final HouseholdRepository householdRepository;
    private final ReimbursementRepository reimbursementRepository;
    private final VehicleRepository vehicleRepository;

    public void createJsonBackup(String backupDir) {
        log.info("Starting JSON backup generation...");
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        File file = new File(backupDir + "/manaKhata_backup_" + timestamp + ".json");

        try {
            Map<String, Object> backupData = Map.of(
                "expenses", expenseRepository.findAll(),
                "households", householdRepository.findAll(),
                "reimbursements", reimbursementRepository.findAll(),
                "vehicles", vehicleRepository.findAll(),
                "timestamp", LocalDateTime.now().toString()
            );

            mapper.writerWithDefaultPrettyPrinter().writeValue(file, backupData);
            log.info("JSON backup generated successfully at {}", file.getAbsolutePath());
        } catch (Exception e) {
            log.error("Failed to generate JSON backup: {}", e.getMessage(), e);
        }
    }
}
