package com.manaKhata.expense;

import com.manaKhata.auth.User;
import com.manaKhata.common.ApiResponse;
import com.manaKhata.backup.DataChangedEvent;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
@SuppressWarnings("null")
public class ExpenseController {

    private final ExpenseRepository expenseRepository;
    private final ApplicationEventPublisher eventPublisher;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<Expense>>> getMyExpenses(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String category
    ) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("expenseDate").descending());
        Page<Expense> expenses;

        if (category != null) {
            expenses = expenseRepository.findByHouseholdId(currentUser.getHousehold().getId(), pageable);
        } else {
            expenses = expenseRepository.findByUserId(currentUser.getId(), pageable);
        }

        return ResponseEntity.ok(ApiResponse.success(expenses));
    }

    @GetMapping("/household")
    public ResponseEntity<ApiResponse<Page<Expense>>> getHouseholdExpenses(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        if (!currentUser.getCanViewHousehold() && !currentUser.getIsHousehead()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Access denied"));
        }

        PageRequest pageable = PageRequest.of(page, size, Sort.by("expenseDate").descending());
        Page<Expense> expenses = expenseRepository.findByHouseholdId(
                currentUser.getHousehold().getId(), pageable
        );

        return ResponseEntity.ok(ApiResponse.success(expenses));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Expense>> createExpense(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody ExpenseRequest request
    ) {
        Expense expense = Expense.builder()
                .user(currentUser)
                .household(currentUser.getHousehold())
                .amount(request.getAmount())
                .description(request.getDescription())
                .category(request.getCategory())
                .expenseType(request.getExpenseType())
                .visibility(request.getVisibility() != null ? request.getVisibility() : ExpenseVisibility.PERSONAL)
                .expenseDate(request.getExpenseDate() != null ? request.getExpenseDate() : LocalDate.now())
                .notes(request.getNotes())
                .isShared(request.getIsShared() != null && request.getIsShared())
                .isReimbursable(request.getIsReimbursable() != null && request.getIsReimbursable())
                .paidForHousehold(request.getPaidForHousehold() != null && request.getPaidForHousehold())
                .vehicleId(request.getVehicleId())
                .tripId(request.getTripId())
                .tags(request.getTags())
                .build();

        Expense saved = expenseRepository.save(expense);
        eventPublisher.publishEvent(new DataChangedEvent(this, "Expense", "CREATED"));
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(saved, "Expense added"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Expense>> updateExpense(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id,
            @Valid @RequestBody ExpenseRequest request
    ) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expense not found"));

        if (!expense.getUser().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Access denied"));
        }

        expense.setAmount(request.getAmount());
        expense.setDescription(request.getDescription());
        expense.setCategory(request.getCategory());
        expense.setNotes(request.getNotes());

        Expense updated = expenseRepository.save(expense);
        eventPublisher.publishEvent(new DataChangedEvent(this, "Expense", "UPDATED"));
        return ResponseEntity.ok(ApiResponse.success(updated, "Expense updated"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteExpense(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id
    ) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expense not found"));

        if (!expense.getUser().getId().equals(currentUser.getId()) && !currentUser.getIsHousehead()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Access denied"));
        }

        expenseRepository.delete(expense);
        eventPublisher.publishEvent(new DataChangedEvent(this, "Expense", "DELETED"));
        return ResponseEntity.ok(ApiResponse.success(null, "Expense deleted"));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMonthlySummary(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(defaultValue = "0") int year,
            @RequestParam(defaultValue = "0") int month
    ) {
        LocalDate now = LocalDate.now();
        int y = year == 0 ? now.getYear() : year;
        int m = month == 0 ? now.getMonthValue() : month;

        Double personal = expenseRepository.sumUserExpensesByMonth(currentUser.getId(), y, m);
        Double household = null;

        if (currentUser.getIsHousehead() || currentUser.getCanViewHousehold()) {
            household = expenseRepository.sumHouseholdExpensesByMonth(
                    currentUser.getHousehold().getId(), y, m
            );
        }

        List<Object[]> breakdown = expenseRepository.getCategoryBreakdownByMonth(
                currentUser.getHousehold().getId(), y, m
        );

        Map<String, Object> summary = new HashMap<>();
        summary.put("personalTotal", personal != null ? personal : 0.0);
        summary.put("householdTotal", household != null ? household : 0.0);
        summary.put("year", y);
        summary.put("month", m);
        summary.put("categoryBreakdown", breakdown);

        return ResponseEntity.ok(ApiResponse.success(summary));
    }
}
