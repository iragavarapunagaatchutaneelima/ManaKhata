package com.manaKhata.ai;

import lombok.Builder;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class InvestmentAdvice {
    private Double monthlySurplus;
    private Double recommendedInvestment;
    private String riskProfile;
    private List<InvestmentOption> recommendations;
    private Map<String, Double> allocation;
}
