package com.manaKhata.ai;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AiInsight {
    private String type;       // "WARNING", "TIP", "ALERT", "POSITIVE"
    private String title;
    private String message;
    private String category;
    private Double amount;
    private String icon;
    private Integer priority;
}
