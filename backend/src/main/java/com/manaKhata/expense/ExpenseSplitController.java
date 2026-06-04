package com.manaKhata.expense;

import com.manaKhata.auth.User;
import com.manaKhata.auth.UserRepository;
import com.manaKhata.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/splits")
@RequiredArgsConstructor
public class ExpenseSplitController {

    private final ExpenseSplitRepository splitRepository;
    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;

    /** Get all my IOUs (I owe + owed to me) */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ExpenseSplit>>> getMySplits(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success(splitRepository.findAllByUser(currentUser.getId())));
    }

    /** Get splits where I owe money */
    @GetMapping("/i-owe")
    public ResponseEntity<ApiResponse<List<ExpenseSplit>>> iOwe(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success(
                splitRepository.findByOwedByIdAndIsSettledFalse(currentUser.getId())));
    }

    /** Get splits where others owe me */
    @GetMapping("/owed-to-me")
    public ResponseEntity<ApiResponse<List<ExpenseSplit>>> owedToMe(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success(
                splitRepository.findByOwedToIdAndIsSettledFalse(currentUser.getId())));
    }

    /** Create a split for an expense */
    @PostMapping
    public ResponseEntity<ApiResponse<ExpenseSplit>> createSplit(
            @AuthenticationPrincipal User currentUser,
            @RequestBody Map<String, Object> body) {

        Long expenseId = Long.valueOf(body.get("expenseId").toString());
        Long owedByUserId = Long.valueOf(body.get("owedByUserId").toString());
        Double amount = Double.valueOf(body.get("amount").toString());
        String note = (String) body.getOrDefault("note", "");

        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new RuntimeException("Expense not found"));
        User owedBy = userRepository.findById(owedByUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        ExpenseSplit split = ExpenseSplit.builder()
                .expense(expense)
                .owedBy(owedBy)
                .owedTo(currentUser)
                .amount(amount)
                .note(note)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(splitRepository.save(split)));
    }

    /** Settle a split (mark as paid) */
    @PatchMapping("/{id}/settle")
    public ResponseEntity<ApiResponse<ExpenseSplit>> settle(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id) {
        ExpenseSplit split = splitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Split not found"));
        split.setIsSettled(true);
        return ResponseEntity.ok(ApiResponse.success(splitRepository.save(split)));
    }
}
