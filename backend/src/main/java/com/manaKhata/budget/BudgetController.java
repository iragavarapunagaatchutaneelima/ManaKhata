package com.manaKhata.budget;

import com.manaKhata.auth.User;
import com.manaKhata.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
@SuppressWarnings("null")
public class BudgetController {

    private final BudgetRepository budgetRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Budget>>> getMyBudgets(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(defaultValue = "0") int month,
            @RequestParam(defaultValue = "0") int year
    ) {
        LocalDate now = LocalDate.now();
        int m = month == 0 ? now.getMonthValue() : month;
        int y = year == 0 ? now.getYear() : year;

        List<Budget> budgets = budgetRepository.findByUserIdAndMonthAndYear(currentUser.getId(), m, y);
        return ResponseEntity.ok(ApiResponse.success(budgets));
    }

    @GetMapping("/household")
    public ResponseEntity<ApiResponse<List<Budget>>> getHouseholdBudgets(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(defaultValue = "0") int month,
            @RequestParam(defaultValue = "0") int year
    ) {
        LocalDate now = LocalDate.now();
        int m = month == 0 ? now.getMonthValue() : month;
        int y = year == 0 ? now.getYear() : year;

        List<Budget> budgets = budgetRepository.findByHouseholdIdAndMonthAndYear(
                currentUser.getHousehold().getId(), m, y
        );
        return ResponseEntity.ok(ApiResponse.success(budgets));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Budget>> createBudget(
            @AuthenticationPrincipal User currentUser,
            @RequestBody BudgetRequest request
    ) {
        LocalDate now = LocalDate.now();
        Budget budget = Budget.builder()
                .user(currentUser)
                .household(currentUser.getHousehold())
                .category(request.getCategory())
                .monthlyLimit(request.getMonthlyLimit())
                .currentSpent(0.0)
                .month(request.getMonth() != null ? request.getMonth() : now.getMonthValue())
                .year(request.getYear() != null ? request.getYear() : now.getYear())
                .budgetType(request.getBudgetType() != null ? request.getBudgetType() : BudgetType.PERSONAL)
                .alertAtPercent(request.getAlertAtPercent() != null ? request.getAlertAtPercent() : 80)
                .isActive(true)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(budgetRepository.save(budget), "Budget created"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Budget>> updateBudget(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id,
            @RequestBody BudgetRequest request
    ) {
        Budget budget = budgetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Budget not found"));

        if (request.getMonthlyLimit() != null) budget.setMonthlyLimit(request.getMonthlyLimit());
        if (request.getAlertAtPercent() != null) budget.setAlertAtPercent(request.getAlertAtPercent());

        return ResponseEntity.ok(ApiResponse.success(budgetRepository.save(budget), "Budget updated"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBudget(@PathVariable Long id) {
        Budget budget = budgetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Budget not found"));
        budget.setIsActive(false);
        budgetRepository.save(budget);
        return ResponseEntity.ok(ApiResponse.success(null, "Budget removed"));
    }
}
