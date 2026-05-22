package com.manaKhata.expense;

import com.manaKhata.common.BaseEntity;
import com.manaKhata.auth.User;
import com.manaKhata.household.Household;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "expenses", indexes = {
    @Index(name = "idx_expense_user", columnList = "user_id"),
    @Index(name = "idx_expense_household", columnList = "household_id"),
    @Index(name = "idx_expense_date", columnList = "expense_date"),
    @Index(name = "idx_expense_category", columnList = "category")
})
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Expense extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id", nullable = false)
    private Household household;

    @Column(name = "amount", nullable = false)
    private Double amount;

    @Column(name = "description", nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    private ExpenseCategory category;

    @Enumerated(EnumType.STRING)
    @Column(name = "expense_type", nullable = false)
    private ExpenseType expenseType;

    @Enumerated(EnumType.STRING)
    @Column(name = "visibility")
    @Builder.Default
    private ExpenseVisibility visibility = ExpenseVisibility.PERSONAL;

    @Column(name = "expense_date", nullable = false)
    private LocalDate expenseDate;

    @Column(name = "notes")
    private String notes;

    @Column(name = "receipt_url")
    private String receiptUrl;

    @Column(name = "is_shared")
    @Builder.Default
    private Boolean isShared = false;

    @Column(name = "is_reimbursable")
    @Builder.Default
    private Boolean isReimbursable = false;

    @Column(name = "paid_for_household")
    @Builder.Default
    private Boolean paidForHousehold = false;

    @Column(name = "vehicle_id")
    private Long vehicleId;

    @Column(name = "trip_id")
    private Long tripId;

    @Column(name = "tags")
    private String tags;
}
