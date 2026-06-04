package com.manaKhata.trip;

import com.manaKhata.common.BaseEntity;
import com.manaKhata.household.Household;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "trips")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Trip extends BaseEntity {

    @Column(name = "destination", nullable = false)
    private String destination;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "budget")
    private Double budget;

    @Column(name = "base_currency")
    private String baseCurrency;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id", nullable = false)
    @JsonIgnoreProperties({"members", "hibernateLazyInitializer", "handler"})
    private Household household;
}
