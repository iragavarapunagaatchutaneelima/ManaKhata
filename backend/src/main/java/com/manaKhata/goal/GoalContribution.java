package com.manaKhata.goal;

import com.manaKhata.common.BaseEntity;
import com.manaKhata.auth.User;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "goal_contributions")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class GoalContribution extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "goal_id", nullable = false)
    @JsonIgnoreProperties({"contributions", "household", "createdBy", "hibernateLazyInitializer", "handler"})
    private SavingsGoal goal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"household", "passwordHash", "hibernateLazyInitializer", "handler"})
    private User contributor;

    @Column(name = "amount", nullable = false)
    private Double amount;

    @Column(name = "contribution_date")
    private LocalDate contributionDate;

    @Column(name = "note")
    private String note;
}
