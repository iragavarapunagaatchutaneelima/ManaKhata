package com.manaKhata.backup;

import com.manaKhata.expense.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.FileOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExcelBackupEngine {

    private final ExpenseRepository expenseRepository;

    public void createExcelBackup(String backupDir) {
        log.info("Starting Excel backup generation...");
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String filePath = backupDir + "/manaKhata_backup_" + timestamp + ".xlsx";

        try (Workbook workbook = new XSSFWorkbook(); FileOutputStream out = new FileOutputStream(filePath)) {

            Sheet expenseSheet = workbook.createSheet("Expenses");
            Row header = expenseSheet.createRow(0);
            header.createCell(0).setCellValue("ID");
            header.createCell(1).setCellValue("Date");
            header.createCell(2).setCellValue("Amount");
            header.createCell(3).setCellValue("Category");
            header.createCell(4).setCellValue("Description");

            var expenses = expenseRepository.findAll();
            int rowIdx = 1;
            for (var expense : expenses) {
                Row row = expenseSheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(expense.getId() != null ? expense.getId() : 0);
                row.createCell(1).setCellValue(expense.getExpenseDate() != null ? expense.getExpenseDate().toString() : "");
                row.createCell(2).setCellValue(expense.getAmount() != null ? expense.getAmount() : 0.0);
                row.createCell(3).setCellValue(expense.getCategory() != null ? expense.getCategory().name() : "");
                row.createCell(4).setCellValue(expense.getDescription() != null ? expense.getDescription() : "");
            }

            // Optional: Autosize columns
            for(int i=0; i<5; i++) {
                expenseSheet.autoSizeColumn(i);
            }

            workbook.write(out);
            log.info("Excel backup generated successfully at {}", filePath);
        } catch (Exception e) {
            log.error("Failed to generate Excel backup: {}", e.getMessage(), e);
        }
    }
}
