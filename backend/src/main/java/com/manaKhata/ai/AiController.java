package com.manaKhata.ai;

import com.manaKhata.auth.User;
import com.manaKhata.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiInsightService aiInsightService;

    @GetMapping("/insights")
    public ResponseEntity<ApiResponse<List<AiInsight>>> getInsights(
            @AuthenticationPrincipal User currentUser
    ) {
        List<AiInsight> insights = aiInsightService.generateInsights(currentUser);
        return ResponseEntity.ok(ApiResponse.success(insights));
    }

    @GetMapping("/health-score")
    public ResponseEntity<ApiResponse<FinancialHealthScore>> getHealthScore(
            @AuthenticationPrincipal User currentUser
    ) {
        FinancialHealthScore score = aiInsightService.calculateHealthScore(currentUser);
        return ResponseEntity.ok(ApiResponse.success(score));
    }

    @GetMapping("/predictions")
    public ResponseEntity<ApiResponse<List<ExpensePrediction>>> getPredictions(
            @AuthenticationPrincipal User currentUser
    ) {
        List<ExpensePrediction> predictions = aiInsightService.generatePredictions(currentUser);
        return ResponseEntity.ok(ApiResponse.success(predictions));
    }

    @GetMapping("/investments")
    public ResponseEntity<ApiResponse<InvestmentAdvice>> getInvestmentAdvice(
            @AuthenticationPrincipal User currentUser
    ) {
        InvestmentAdvice advice = aiInsightService.generateInvestmentAdvice(currentUser);
        return ResponseEntity.ok(ApiResponse.success(advice));
    }
}
