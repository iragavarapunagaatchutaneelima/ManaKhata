package com.manaKhata.budget;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {
    List<Budget> findByHouseholdIdAndMonthAndYear(Long householdId, Integer month, Integer year);
    List<Budget> findByUserIdAndMonthAndYear(Long userId, Integer month, Integer year);
    Optional<Budget> findByUserIdAndCategoryAndMonthAndYear(Long userId, com.manaKhata.expense.ExpenseCategory category, Integer month, Integer year);
}
