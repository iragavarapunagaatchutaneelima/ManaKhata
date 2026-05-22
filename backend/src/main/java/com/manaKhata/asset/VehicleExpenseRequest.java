package com.manaKhata.asset;

import lombok.Data;
import java.time.LocalDate;

@Data
public class VehicleExpenseRequest {
    private Double amount;
    private String description;
    private VehicleExpenseType expenseType;
    private LocalDate expenseDate;
    private Double fuelLiters;
    private Double odometerReading;
    private String notes;
}
