package com.manaKhata.investment;

import com.manaKhata.common.BaseEntity;
import com.manaKhata.household.Household;
import com.manaKhata.auth.User;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "investment_assets")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class InvestmentAsset extends BaseEntity {

    @Column(name = "name", nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "asset_type", nullable = false)
    private InvestmentAssetType assetType;

    @Column(name = "invested_amount", nullable = false)
    private Double investedAmount;

    @Column(name = "current_value")
    private Double currentValue;

    @Column(name = "investment_date")
    private LocalDate investmentDate;

    @Column(name = "platform_or_broker")
    private String platformOrBroker;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id", nullable = false)
    @JsonIgnoreProperties({"members", "hibernateLazyInitializer", "handler"})
    private Household household;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    @JsonIgnoreProperties({"household", "passwordHash", "hibernateLazyInitializer", "handler"})
    private User owner;
}
