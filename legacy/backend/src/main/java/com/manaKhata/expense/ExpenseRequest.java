package com.manaKhata.expense;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ExpenseRequest {
    @NotNull
    @Positive
    private Double amount;

    @NotBlank
    private String description;

    @NotNull
    private ExpenseCategory category;

    @NotNull
    @com.fasterxml.jackson.annotation.JsonProperty("expenseType")
    @com.fasterxml.jackson.annotation.JsonAlias("type")
    private ExpenseType expenseType;

    private ExpenseVisibility visibility;
    private LocalDate expenseDate;
    private String notes;
    private Boolean isShared;
    private Boolean isReimbursable;
    private Boolean paidForHousehold;
    private Long vehicleId;
    private Long tripId;
    private String tags;
}
