package com.manaKhata.tax;

import com.manaKhata.common.BaseEntity;
import com.manaKhata.household.Household;
import com.manaKhata.auth.User;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "tax_documents")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class TaxDocument extends BaseEntity {

    @Column(name = "document_name", nullable = false)
    private String documentName;

    @Column(name = "category")
    private String category; // e.g. 80C, 80D, HRA

    @Column(name = "amount", nullable = false)
    private Double amount;

    @Column(name = "financial_year", nullable = false)
    private String financialYear;

    @Column(name = "date_uploaded")
    private LocalDate dateUploaded;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id", nullable = false)
    @JsonIgnoreProperties({"members", "hibernateLazyInitializer", "handler"})
    private Household household;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    @JsonIgnoreProperties({"household", "passwordHash", "hibernateLazyInitializer", "handler"})
    private User owner;
}
