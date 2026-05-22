package com.manaKhata.analytics;

import com.manaKhata.auth.User;
import com.manaKhata.auth.UserRepository;
import com.manaKhata.common.ApiResponse;
import com.manaKhata.expense.ExpenseRepository;
import com.manaKhata.reimbursement.ReimbursementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final ExpenseRepository expenseRepository;
    private final ReimbursementRepository reimbursementRepository;
    private final UserRepository userRepository;

    @GetMapping("/household")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getHouseholdAnalytics(
            @AuthenticationPrincipal User currentUser
    ) {
        Long householdId = currentUser.getHousehold().getId();
        LocalDate now = LocalDate.now();

        Map<String, Object> analytics = new LinkedHashMap<>();

        // Monthly totals for last 6 months
        List<Map<String, Object>> monthlyTrend = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            LocalDate date = now.minusMonths(i);
            Double total = expenseRepository.sumHouseholdExpensesByMonth(
                    householdId, date.getYear(), date.getMonthValue());
            Map<String, Object> monthData = new LinkedHashMap<>();
            monthData.put("month", date.getMonth().name().substring(0, 3));
            monthData.put("year", date.getYear());
            monthData.put("total", total != null ? total : 0.0);
            monthlyTrend.add(monthData);
        }
        analytics.put("monthlyTrend", monthlyTrend);

        // Category breakdown for current month
        List<Object[]> breakdown = expenseRepository.getCategoryBreakdownByMonth(
                householdId, now.getYear(), now.getMonthValue());

        List<Map<String, Object>> categoryData = new ArrayList<>();
        for (Object[] row : breakdown) {
            Map<String, Object> cat = new LinkedHashMap<>();
            cat.put("category", row[0].toString());
            cat.put("amount", ((Number) row[1]).doubleValue());
            categoryData.add(cat);
        }
        analytics.put("categoryBreakdown", categoryData);

        // Per-member spending
        List<User> members = userRepository.findByHouseholdId(householdId);
        List<Map<String, Object>> memberSpending = new ArrayList<>();
        for (User member : members) {
            Double spent = expenseRepository.sumUserExpensesByMonth(
                    member.getId(), now.getYear(), now.getMonthValue());
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("memberId", member.getId());
            m.put("name", member.getFullName());
            m.put("role", member.getRole().name());
            m.put("spent", spent != null ? spent : 0.0);
            m.put("walletBalance", member.getWalletBalance());
            memberSpending.add(m);
        }
        analytics.put("memberSpending", memberSpending);

        // Reimbursement summary
        Double pendingReimb = reimbursementRepository.sumPendingByHousehold(householdId);
        analytics.put("pendingReimbursements", pendingReimb != null ? pendingReimb : 0.0);

        // Total household income
        double totalIncome = members.stream()
                .mapToDouble(m -> m.getMonthlyIncome() != null ? m.getMonthlyIncome() : 0)
                .sum();
        analytics.put("totalMonthlyIncome", totalIncome);

        // This month total
        Double currentMonthTotal = expenseRepository.sumHouseholdExpensesByMonth(
                householdId, now.getYear(), now.getMonthValue());
        analytics.put("currentMonthTotal", currentMonthTotal != null ? currentMonthTotal : 0.0);
        analytics.put("netSavings", totalIncome - (currentMonthTotal != null ? currentMonthTotal : 0.0));

        return ResponseEntity.ok(ApiResponse.success(analytics));
    }

    @GetMapping("/personal")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPersonalAnalytics(
            @AuthenticationPrincipal User currentUser
    ) {
        LocalDate now = LocalDate.now();
        Map<String, Object> analytics = new LinkedHashMap<>();

        // Monthly trend
        List<Map<String, Object>> monthlyTrend = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            LocalDate date = now.minusMonths(i);
            Double total = expenseRepository.sumUserExpensesByMonth(
                    currentUser.getId(), date.getYear(), date.getMonthValue());
            Map<String, Object> md = new LinkedHashMap<>();
            md.put("month", date.getMonth().name().substring(0, 3));
            md.put("year", date.getYear());
            md.put("total", total != null ? total : 0.0);
            monthlyTrend.add(md);
        }
        analytics.put("monthlyTrend", monthlyTrend);

        // This month
        Double currentSpend = expenseRepository.sumUserExpensesByMonth(
                currentUser.getId(), now.getYear(), now.getMonthValue());
        Double income = currentUser.getMonthlyIncome() != null ? currentUser.getMonthlyIncome() : 0;
        analytics.put("currentMonthSpend", currentSpend != null ? currentSpend : 0.0);
        analytics.put("monthlyIncome", income);
        analytics.put("savings", income - (currentSpend != null ? currentSpend : 0.0));
        analytics.put("walletBalance", currentUser.getWalletBalance());

        // Pending reimbursements owed to me
        Double pendingByMe = reimbursementRepository.sumPendingByUser(currentUser.getId());
        analytics.put("pendingReimbursements", pendingByMe != null ? pendingByMe : 0.0);

        return ResponseEntity.ok(ApiResponse.success(analytics));
    }
}
