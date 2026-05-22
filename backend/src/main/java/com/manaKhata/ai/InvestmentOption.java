package com.manaKhata.ai;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class InvestmentOption {
    private String name;
    private String type;
    private Double suggestedAmount;
    private String expectedReturn;
    private String riskLevel;
    private String description;
    private String icon;
}
