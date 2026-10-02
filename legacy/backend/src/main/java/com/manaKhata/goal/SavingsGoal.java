package com.manaKhata.goal;

import com.manaKhata.common.BaseEntity;
import com.manaKhata.household.Household;
import com.manaKhata.auth.User;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "savings_goals")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class SavingsGoal extends BaseEntity {

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description")
    private String description;

    @Column(name = "target_amount", nullable = false)
    private Double targetAmount;

    @Column(name = "current_amount")
    @Builder.Default
    private Double currentAmount = 0.0;

    @Column(name = "target_date")
    private LocalDate targetDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id", nullable = false)
    @JsonIgnoreProperties({"members", "hibernateLazyInitializer", "handler"})
    private Household household;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id", nullable = false)
    @JsonIgnoreProperties({"household", "passwordHash", "hibernateLazyInitializer", "handler"})
    private User createdBy;

    @OneToMany(mappedBy = "goal", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @Builder.Default
    private List<GoalContribution> contributions = new ArrayList<>();
}
