package com.manaKhata.ai;

import com.manaKhata.auth.User;
import com.manaKhata.expense.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiInsightService {

    private final ExpenseRepository expenseRepository;

    public List<AiInsight> generateInsights(User user) {
        List<AiInsight> insights = new ArrayList<>();
        LocalDate now = LocalDate.now();
        int currentMonth = now.getMonthValue();
        int currentYear = now.getYear();
        int prevMonth = currentMonth == 1 ? 12 : currentMonth - 1;
        int prevYear = currentMonth == 1 ? currentYear - 1 : currentYear;

        Double currentSpend = expenseRepository.sumUserExpensesByMonth(user.getId(), currentYear, currentMonth);
        Double prevSpend = expenseRepository.sumUserExpensesByMonth(user.getId(), prevYear, prevMonth);

        if (currentSpend == null) currentSpend = 0.0;
        if (prevSpend == null) prevSpend = 0.0;

        // Overspending detection
        if (prevSpend > 0 && currentSpend > prevSpend * 1.2) {
            double increase = ((currentSpend - prevSpend) / prevSpend) * 100;
            insights.add(AiInsight.builder()
                    .type("WARNING")
                    .title("Spending Surge Detected")
                    .message(String.format("Your spending increased by %.0f%% compared to last month. Review your expenses to identify opportunities to save.", increase))
                    .category("OVERALL")
                    .amount(currentSpend - prevSpend)
                    .icon("⚠️")
                    .priority(1)
                    .build());
        }

        // Savings suggestion
        Double income = user.getMonthlyIncome();
        if (income != null && income > 0) {
            double savingsRate = ((income - currentSpend) / income) * 100;
            if (savingsRate < 10) {
                insights.add(AiInsight.builder()
                        .type("ALERT")
                        .title("Low Savings Rate")
                        .message(String.format("You're saving only %.0f%% of your income. Financial experts recommend saving at least 20%%. Consider reviewing variable expenses.", savingsRate))
                        .category("SAVINGS")
                        .icon("💰")
                        .priority(2)
                        .build());
            } else if (savingsRate >= 30) {
                insights.add(AiInsight.builder()
                        .type("POSITIVE")
                        .title("Excellent Savings Rate")
                        .message(String.format("You're saving %.0f%% of your income. Consider investing your surplus for better returns.", savingsRate))
                        .category("SAVINGS")
                        .icon("🎯")
                        .priority(3)
                        .build());
            }
        }

        // Category analysis
        List<Object[]> breakdown = expenseRepository.getCategoryBreakdownByMonth(
                user.getHousehold().getId(), currentYear, currentMonth);

        for (Object[] row : breakdown) {
            String cat = row[0].toString();
            Double amount = ((Number) row[1]).doubleValue();

            if ("FOOD".equals(cat) && amount > 15000) {
                insights.add(AiInsight.builder()
                        .type("TIP")
                        .title("Food Expenses High")
                        .message(String.format("₹%.0f spent on food this month. Meal planning and cooking at home can reduce this by 30-40%%.", amount))
                        .category("FOOD")
                        .amount(amount)
                        .icon("🍽️")
                        .priority(4)
                        .build());
            }
            if ("PETROL".equals(cat) && amount > 5000) {
                insights.add(AiInsight.builder()
                        .type("TIP")
                        .title("Fuel Cost Optimization")
                        .message(String.format("₹%.0f spent on fuel. Carpooling or combining trips could save ₹%.0f per month.", amount, amount * 0.2))
                        .category("PETROL")
                        .amount(amount)
                        .icon("⛽")
                        .priority(5)
                        .build());
            }
        }

        // Reimbursement reminder
        insights.add(AiInsight.builder()
                .type("TIP")
                .title("Track Reimbursements")
                .message("Ensure all household payments made by family members are logged for reimbursement.")
                .category("REIMBURSEMENT")
                .icon("🔄")
                .priority(6)
                .build());

        return insights;
    }

    public FinancialHealthScore calculateHealthScore(User user) {
        LocalDate now = LocalDate.now();
        Double monthlyExpense = expenseRepository.sumUserExpensesByMonth(user.getId(), now.getYear(), now.getMonthValue());
        if (monthlyExpense == null) monthlyExpense = 0.0;

        Double income = user.getMonthlyIncome() != null ? user.getMonthlyIncome() : 0.0;

        // Savings ratio score (0-30)
        double savingsRatio = income > 0 ? ((income - monthlyExpense) / income) : 0;
        int savingsScore = (int) Math.min(30, Math.max(0, savingsRatio * 100));

        // Expense stability score (0-25)
        Double prevExpense = expenseRepository.sumUserExpensesByMonth(user.getId(),
                now.getYear(), now.getMonthValue() == 1 ? 12 : now.getMonthValue() - 1);
        if (prevExpense == null) prevExpense = monthlyExpense;
        double stabilityRatio = prevExpense > 0 ? Math.abs(monthlyExpense - prevExpense) / prevExpense : 0;
        int stabilityScore = (int) Math.min(25, Math.max(0, (1 - stabilityRatio) * 25));

        // Emergency readiness (0-25) — simplified
        double walletBalance = user.getWalletBalance() != null ? user.getWalletBalance() : 0;
        double emergencyMonths = income > 0 ? walletBalance / monthlyExpense : 0;
        int emergencyScore = (int) Math.min(25, emergencyMonths * 8);

        // Investment (0-20) — simplified rule-based
        int investmentScore = savingsRatio > 0.2 ? 15 : (savingsRatio > 0.1 ? 8 : 3);

        int totalScore = savingsScore + stabilityScore + emergencyScore + investmentScore;

        String grade = totalScore >= 85 ? "A" : totalScore >= 70 ? "B" : totalScore >= 55 ? "C" : totalScore >= 40 ? "D" : "F";
        String status = totalScore >= 85 ? "Excellent" : totalScore >= 70 ? "Good" : totalScore >= 55 ? "Fair" : "Poor";

        List<String> strengths = new ArrayList<>();
        List<String> improvements = new ArrayList<>();

        if (savingsRatio > 0.2) strengths.add("Strong savings rate");
        else improvements.add("Increase monthly savings to 20% of income");

        if (stabilityScore > 18) strengths.add("Consistent spending patterns");
        else improvements.add("Reduce month-to-month spending fluctuations");

        if (emergencyScore > 15) strengths.add("Good emergency fund");
        else improvements.add("Build emergency fund covering 3-6 months of expenses");

        Map<String, Integer> breakdown = new LinkedHashMap<>();
        breakdown.put("Savings Rate", savingsScore);
        breakdown.put("Expense Stability", stabilityScore);
        breakdown.put("Emergency Readiness", emergencyScore);
        breakdown.put("Investment Balance", investmentScore);

        return FinancialHealthScore.builder()
                .score(totalScore)
                .grade(grade)
                .status(status)
                .savingsRatio(Math.round(savingsRatio * 1000.0) / 10.0)
                .expenseStability(Math.round((1 - stabilityRatio) * 100.0) / 100.0)
                .emergencyReadiness(Math.round(emergencyMonths * 10.0) / 10.0)
                .investmentBalance(savingsRatio > 0.2 ? 75.0 : savingsRatio * 100 * 3)
                .strengths(strengths)
                .improvements(improvements)
                .breakdown(breakdown)
                .build();
    }

    public List<ExpensePrediction> generatePredictions(User user) {
        List<ExpensePrediction> predictions = new ArrayList<>();
        LocalDate now = LocalDate.now();

        List<Object[]> currentBreakdown = expenseRepository.getCategoryBreakdownByMonth(
                user.getHousehold().getId(), now.getYear(), now.getMonthValue());
        List<Object[]> prevBreakdown = expenseRepository.getCategoryBreakdownByMonth(
                user.getHousehold().getId(),
                now.getMonthValue() == 1 ? now.getYear() - 1 : now.getYear(),
                now.getMonthValue() == 1 ? 12 : now.getMonthValue() - 1);

        Map<String, Double> currentMap = new HashMap<>();
        Map<String, Double> prevMap = new HashMap<>();
        for (Object[] r : currentBreakdown) currentMap.put(r[0].toString(), ((Number) r[1]).doubleValue());
        for (Object[] r : prevBreakdown) prevMap.put(r[0].toString(), ((Number) r[1]).doubleValue());

        Set<String> allCategories = new HashSet<>(currentMap.keySet());
        allCategories.addAll(prevMap.keySet());

        for (String cat : allCategories) {
            double current = currentMap.getOrDefault(cat, 0.0);
            double prev = prevMap.getOrDefault(cat, current);
            double changePercent = prev > 0 ? ((current - prev) / prev) * 100 : 0;
            double predicted = current * (1 + (changePercent / 100) * 0.5); // dampen prediction

            String trend = changePercent > 5 ? "UP" : changePercent < -5 ? "DOWN" : "STABLE";
            String reason = trend.equals("UP")
                    ? String.format("%.0f%% increase trend observed", Math.abs(changePercent))
                    : trend.equals("DOWN")
                    ? String.format("%.0f%% decrease from last month", Math.abs(changePercent))
                    : "Spending consistent with last month";

            predictions.add(ExpensePrediction.builder()
                    .category(cat)
                    .predictedAmount(Math.round(predicted * 100.0) / 100.0)
                    .lastMonthAmount(prev)
                    .changePercent(Math.round(changePercent * 10.0) / 10.0)
                    .trend(trend)
                    .reason(reason)
                    .build());
        }

        // Add seasonal predictions
        int month = now.getMonthValue();
        if (month == 10 || month == 11) {
            predictions.add(ExpensePrediction.builder()
                    .category("SHOPPING")
                    .predictedAmount(8000.0)
                    .lastMonthAmount(3000.0)
                    .changePercent(166.0)
                    .trend("UP")
                    .reason("Festival season — Diwali shopping expected")
                    .build());
        }

        return predictions;
    }

    public InvestmentAdvice generateInvestmentAdvice(User user) {
        Double income = user.getMonthlyIncome() != null ? user.getMonthlyIncome() : 50000.0;
        LocalDate now = LocalDate.now();
        Double expense = expenseRepository.sumUserExpensesByMonth(user.getId(), now.getYear(), now.getMonthValue());
        if (expense == null) expense = income * 0.7;

        double surplus = Math.max(0, income - expense);
        double recommended = surplus * 0.7;

        String riskProfile = surplus > 20000 ? "Moderate-High" : surplus > 10000 ? "Moderate" : "Conservative";

        List<InvestmentOption> options = new ArrayList<>();

        if ("Conservative".equals(riskProfile)) {
            options.add(InvestmentOption.builder()
                    .name("Fixed Deposit")
                    .type("FD")
                    .suggestedAmount(recommended * 0.5)
                    .expectedReturn("6.5-7.5% p.a.")
                    .riskLevel("LOW")
                    .description("Safe, guaranteed returns. Best for emergency corpus.")
                    .icon("🏦")
                    .build());
            options.add(InvestmentOption.builder()
                    .name("PPF (Public Provident Fund)")
                    .type("PPF")
                    .suggestedAmount(recommended * 0.3)
                    .expectedReturn("7.1% p.a. (tax-free)")
                    .riskLevel("LOW")
                    .description("Government-backed, tax-free returns. 15-year lock-in.")
                    .icon("📊")
                    .build());
        } else if ("Moderate".equals(riskProfile)) {
            options.add(InvestmentOption.builder()
                    .name("Mutual Fund SIP")
                    .type("SIP")
                    .suggestedAmount(recommended * 0.4)
                    .expectedReturn("10-14% p.a. (estimated)")
                    .riskLevel("MEDIUM")
                    .description("Diversified equity funds via systematic investment.")
                    .icon("📈")
                    .build());
            options.add(InvestmentOption.builder()
                    .name("Fixed Deposit")
                    .type("FD")
                    .suggestedAmount(recommended * 0.3)
                    .expectedReturn("6.5-7.5% p.a.")
                    .riskLevel("LOW")
                    .description("Safe returns for short-term goals.")
                    .icon("🏦")
                    .build());
        } else {
            options.add(InvestmentOption.builder()
                    .name("Index Funds")
                    .type("MF")
                    .suggestedAmount(recommended * 0.4)
                    .expectedReturn("11-15% p.a. (historical)")
                    .riskLevel("MEDIUM")
                    .description("Nifty 50 / Sensex index tracking for market returns.")
                    .icon("🚀")
                    .build());
            options.add(InvestmentOption.builder()
                    .name("Gold ETF")
                    .type("GOLD")
                    .suggestedAmount(recommended * 0.2)
                    .expectedReturn("8-10% p.a. (historical)")
                    .riskLevel("MEDIUM")
                    .description("Digital gold as inflation hedge.")
                    .icon("🥇")
                    .build());
            options.add(InvestmentOption.builder()
                    .name("Emergency Fund")
                    .type("LIQUID")
                    .suggestedAmount(recommended * 0.2)
                    .expectedReturn("4-5% p.a.")
                    .riskLevel("VERY_LOW")
                    .description("Liquid fund for 3-6 month expenses coverage.")
                    .icon("🛡️")
                    .build());
        }

        Map<String, Double> allocation = new LinkedHashMap<>();
        allocation.put("Equity", riskProfile.contains("High") ? 50.0 : 30.0);
        allocation.put("Debt", riskProfile.contains("High") ? 20.0 : 40.0);
        allocation.put("Gold", 10.0);
        allocation.put("Liquid", 20.0);

        return InvestmentAdvice.builder()
                .monthlySurplus(Math.round(surplus * 100.0) / 100.0)
                .recommendedInvestment(Math.round(recommended * 100.0) / 100.0)
                .riskProfile(riskProfile)
                .recommendations(options)
                .allocation(allocation)
                .build();
    }
}
