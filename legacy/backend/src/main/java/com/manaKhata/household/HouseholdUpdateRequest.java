package com.manaKhata.household;

import lombok.Data;

@Data
public class HouseholdUpdateRequest {
    private String name;
    private String description;
    private String address;
    private String city;
    private Double monthlyIncome;
}
