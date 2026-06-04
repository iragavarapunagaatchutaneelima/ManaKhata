package com.manaKhata.grocery;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroceryListRepository extends JpaRepository<GroceryList, Long> {
    List<GroceryList> findByHouseholdIdOrderByCreatedAtDesc(Long householdId);
    List<GroceryList> findByHouseholdIdAndIsCompletedOrderByCreatedAtDesc(Long householdId, Boolean isCompleted);
}
