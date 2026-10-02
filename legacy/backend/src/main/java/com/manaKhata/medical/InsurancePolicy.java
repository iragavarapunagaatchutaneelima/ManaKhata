package com.manaKhata.medical;

import com.manaKhata.common.BaseEntity;
import com.manaKhata.household.Household;
import com.manaKhata.auth.User;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "insurance_policies")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class InsurancePolicy extends BaseEntity {

    @Column(name = "provider", nullable = false)
    private String provider;

    @Column(name = "policy_number", nullable = false)
    private String policyNumber;

    @Column(name = "policy_type")
    private String policyType; // e.g. Health, Term Life, Vehicle

    @Column(name = "coverage_amount", nullable = false)
    private Double coverageAmount;

    @Column(name = "premium_amount")
    private Double premiumAmount;

    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id", nullable = false)
    @JsonIgnoreProperties({"members", "hibernateLazyInitializer", "handler"})
    private Household household;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    @JsonIgnoreProperties({"household", "passwordHash", "hibernateLazyInitializer", "handler"})
    private User owner;
}
