package com.manaKhata.asset;

import com.manaKhata.common.BaseEntity;
import com.manaKhata.auth.User;
import com.manaKhata.household.Household;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "vehicle_expenses", indexes = {
    @Index(name = "idx_vexp_vehicle", columnList = "vehicle_id"),
    @Index(name = "idx_vexp_user", columnList = "contributor_id")
})
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class VehicleExpense extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contributor_id", nullable = false)
    private User contributor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id", nullable = false)
    private Household household;

    @Column(name = "amount", nullable = false)
    private Double amount;

    @Column(name = "description", nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "expense_type", nullable = false)
    private VehicleExpenseType expenseType;

    @Column(name = "expense_date", nullable = false)
    private LocalDate expenseDate;

    @Column(name = "fuel_liters")
    private Double fuelLiters;

    @Column(name = "odometer_reading")
    private Double odometerReading;

    @Column(name = "notes")
    private String notes;
}
