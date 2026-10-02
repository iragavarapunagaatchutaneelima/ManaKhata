package com.manaKhata.reimbursement;

import com.manaKhata.common.BaseEntity;
import com.manaKhata.auth.User;
import com.manaKhata.household.Household;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "reimbursements", indexes = {
    @Index(name = "idx_reimb_household", columnList = "household_id"),
    @Index(name = "idx_reimb_payer", columnList = "payer_id"),
    @Index(name = "idx_reimb_status", columnList = "status")
})
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Reimbursement extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payer_id", nullable = false)
    @JsonIgnoreProperties({"household", "passwordHash", "hibernateLazyInitializer", "handler"})
    private User payer; // Who paid initially

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reimbursee_id")
    @JsonIgnoreProperties({"household", "passwordHash", "hibernateLazyInitializer", "handler"})
    private User reimbursee; // Who needs to pay back (null = household)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id", nullable = false)
    @JsonIgnoreProperties({"members", "hibernateLazyInitializer", "handler"})
    private Household household;

    @Column(name = "amount", nullable = false)
    private Double amount;

    @Column(name = "description", nullable = false)
    private String description;

    @Column(name = "category")
    private String category;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private ReimbursementStatus status = ReimbursementStatus.PENDING;

    @Column(name = "paid_date", nullable = false)
    private LocalDate paidDate;

    @Column(name = "settled_date")
    private LocalDate settledDate;

    @Column(name = "notes")
    private String notes;

    @Column(name = "receipt_url")
    private String receiptUrl;

    @Column(name = "is_household_expense")
    @Builder.Default
    private Boolean isHouseholdExpense = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_id")
    @JsonIgnoreProperties({"household", "passwordHash", "hibernateLazyInitializer", "handler"})
    private User approvedBy;
}
