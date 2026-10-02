package com.manaKhata.ai;

import lombok.Builder;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class FinancialHealthScore {
    private Integer score;          // 0-100
    private String grade;           // A, B, C, D, F
    private String status;          // "Excellent", "Good", "Fair", "Poor"
    private Double savingsRatio;
    private Double expenseStability;
    private Double emergencyReadiness;
    private Double investmentBalance;
    private List<String> strengths;
    private List<String> improvements;
    private Map<String, Integer> breakdown;
}
