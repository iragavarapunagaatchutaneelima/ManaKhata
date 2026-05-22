package com.manaKhata.household;

import com.manaKhata.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "households")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Household extends BaseEntity {

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description")
    private String description;

    @Column(name = "address")
    private String address;

    @Column(name = "city")
    private String city;

    @Column(name = "country", nullable = false)
    private String country;

    @Column(name = "currency", length = 3)
    @Builder.Default
    private String currency = "INR";

    @Column(name = "monthly_income")
    private Double monthlyIncome;

    @Column(name = "invite_code", unique = true)
    private String inviteCode;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @OneToMany(mappedBy = "household", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<com.manaKhata.auth.User> members = new ArrayList<>();
}
