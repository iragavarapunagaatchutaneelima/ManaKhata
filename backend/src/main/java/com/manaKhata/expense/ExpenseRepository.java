package com.manaKhata.expense;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    Page<Expense> findByUserId(Long userId, Pageable pageable);

    Page<Expense> findByHouseholdId(Long householdId, Pageable pageable);

    @Query("SELECT e FROM Expense e WHERE e.household.id = :householdId AND e.expenseDate BETWEEN :start AND :end ORDER BY e.expenseDate DESC")
    List<Expense> findHouseholdExpensesByDateRange(
        @Param("householdId") Long householdId,
        @Param("start") LocalDate start,
        @Param("end") LocalDate end
    );

    @Query("SELECT e FROM Expense e WHERE e.user.id = :userId AND e.expenseDate BETWEEN :start AND :end ORDER BY e.expenseDate DESC")
    List<Expense> findUserExpensesByDateRange(
        @Param("userId") Long userId,
        @Param("start") LocalDate start,
        @Param("end") LocalDate end
    );

    @Query("SELECT SUM(e.amount) FROM Expense e WHERE e.household.id = :householdId AND YEAR(e.expenseDate) = :year AND MONTH(e.expenseDate) = :month")
    Double sumHouseholdExpensesByMonth(@Param("householdId") Long householdId, @Param("year") int year, @Param("month") int month);

    @Query("SELECT SUM(e.amount) FROM Expense e WHERE e.user.id = :userId AND YEAR(e.expenseDate) = :year AND MONTH(e.expenseDate) = :month")
    Double sumUserExpensesByMonth(@Param("userId") Long userId, @Param("year") int year, @Param("month") int month);

    @Query("SELECT e.category, SUM(e.amount) FROM Expense e WHERE e.household.id = :householdId AND YEAR(e.expenseDate) = :year AND MONTH(e.expenseDate) = :month GROUP BY e.category")
    List<Object[]> getCategoryBreakdownByMonth(@Param("householdId") Long householdId, @Param("year") int year, @Param("month") int month);

    List<Expense> findByHouseholdIdAndCategory(Long householdId, ExpenseCategory category);
}
