package com.manaKhata.budget;

import com.manaKhata.common.BaseEntity;
import com.manaKhata.auth.User;
import com.manaKhata.expense.ExpenseCategory;
import com.manaKhata.household.Household;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "budgets", indexes = {
    @Index(name = "idx_budget_household", columnList = "household_id"),
    @Index(name = "idx_budget_user", columnList = "user_id")
})
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Budget extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id", nullable = false)
    private Household household;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    private ExpenseCategory category;

    @Column(name = "monthly_limit", nullable = false)
    private Double monthlyLimit;

    @Column(name = "current_spent")
    @Builder.Default
    private Double currentSpent = 0.0;

    @Column(name = "month", nullable = false)
    private Integer month;

    @Column(name = "year", nullable = false)
    private Integer year;

    @Enumerated(EnumType.STRING)
    @Column(name = "budget_type")
    @Builder.Default
    private BudgetType budgetType = BudgetType.PERSONAL;

    @Column(name = "alert_at_percent")
    @Builder.Default
    private Integer alertAtPercent = 80;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
}
