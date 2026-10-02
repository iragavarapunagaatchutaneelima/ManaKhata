package com.manaKhata.asset;

import com.manaKhata.common.BaseEntity;
import com.manaKhata.auth.User;
import com.manaKhata.household.Household;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "vehicles")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Vehicle extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    @JsonIgnoreProperties({"household", "passwordHash", "hibernateLazyInitializer", "handler"})
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id", nullable = false)
    @JsonIgnoreProperties({"members", "hibernateLazyInitializer", "handler"})
    private Household household;

    @Column(name = "name", nullable = false)
    private String name; // e.g., "Father's Honda Activa"

    @Column(name = "registration_number")
    private String registrationNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "vehicle_type", nullable = false)
    private VehicleType vehicleType;

    @Column(name = "make")
    private String make;

    @Column(name = "model")
    private String model;

    @Column(name = "year")
    private Integer year;

    @Column(name = "fuel_type")
    private String fuelType;

    @Column(name = "mileage_kmpl")
    private Double mileageKmpl;

    @Column(name = "insurance_expiry")
    private String insuranceExpiry;

    @Column(name = "puc_expiry")
    private String pucExpiry;

    @Column(name = "last_service_date")
    private String lastServiceDate;

    @Column(name = "next_service_due")
    private String nextServiceDue;

    @Column(name = "total_fuel_cost")
    @Builder.Default
    private Double totalFuelCost = 0.0;

    @Column(name = "total_maintenance_cost")
    @Builder.Default
    private Double totalMaintenanceCost = 0.0;

    @Column(name = "is_shared")
    @Builder.Default
    private Boolean isShared = false;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "notes")
    private String notes;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
}
