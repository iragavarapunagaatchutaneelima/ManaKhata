package com.manaKhata.reimbursement;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ReimbursementRequest {
    @NotNull @Positive
    private Double amount;

    @NotBlank
    private String description;

    private String category;
    private Long reimburseeId;
    private LocalDate paidDate;
    private String notes;
    private Boolean isHouseholdExpense;
}
