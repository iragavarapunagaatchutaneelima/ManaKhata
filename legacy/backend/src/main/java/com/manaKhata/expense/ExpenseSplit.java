package com.manaKhata.expense;

import com.manaKhata.common.BaseEntity;
import com.manaKhata.auth.User;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "expense_splits")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class ExpenseSplit extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expense_id", nullable = false)
    @JsonIgnoreProperties({"user","household","hibernateLazyInitializer","handler"})
    private Expense expense;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owed_by_user_id", nullable = false)
    @JsonIgnoreProperties({"household","passwordHash","hibernateLazyInitializer","handler"})
    private User owedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owed_to_user_id", nullable = false)
    @JsonIgnoreProperties({"household","passwordHash","hibernateLazyInitializer","handler"})
    private User owedTo;

    @Column(name = "amount", nullable = false)
    private Double amount;

    @Column(name = "is_settled")
    @Builder.Default
    private Boolean isSettled = false;

    @Column(name = "note")
    private String note;
}
