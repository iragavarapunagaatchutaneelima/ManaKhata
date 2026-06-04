package com.manaKhata.expense;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExpenseSplitRepository extends JpaRepository<ExpenseSplit, Long> {
    List<ExpenseSplit> findByOwedByIdAndIsSettledFalse(Long userId);
    List<ExpenseSplit> findByOwedToIdAndIsSettledFalse(Long userId);

    @Query("SELECT s FROM ExpenseSplit s WHERE (s.owedBy.id = :userId OR s.owedTo.id = :userId) ORDER BY s.createdAt DESC")
    List<ExpenseSplit> findAllByUser(Long userId);
}
