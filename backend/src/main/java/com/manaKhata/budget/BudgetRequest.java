package com.manaKhata.budget;

import com.manaKhata.expense.ExpenseCategory;
import lombok.Data;

@Data
public class BudgetRequest {
    private ExpenseCategory category;
    private Double monthlyLimit;
    private Integer month;
    private Integer year;
    private BudgetType budgetType;
    private Integer alertAtPercent;
}
