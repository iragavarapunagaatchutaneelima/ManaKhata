package com.manaKhata.chore;

import com.manaKhata.common.BaseEntity;
import com.manaKhata.household.Household;
import com.manaKhata.auth.User;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "chores")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Chore extends BaseEntity {

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description")
    private String description;

    @Column(name = "reward_amount", nullable = false)
    private Double rewardAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private ChoreStatus status = ChoreStatus.PENDING;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id", nullable = false)
    @JsonIgnoreProperties({"members", "hibernateLazyInitializer", "handler"})
    private Household household;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id", nullable = false)
    @JsonIgnoreProperties({"household", "passwordHash", "hibernateLazyInitializer", "handler"})
    private User assignedTo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by_id", nullable = false)
    @JsonIgnoreProperties({"household", "passwordHash", "hibernateLazyInitializer", "handler"})
    private User assignedBy;
}
