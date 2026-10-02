package com.manaKhata.ai;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ExpensePrediction {
    private String category;
    private Double predictedAmount;
    private Double lastMonthAmount;
    private Double changePercent;
    private String trend;       // "UP", "DOWN", "STABLE"
    private String reason;
}
