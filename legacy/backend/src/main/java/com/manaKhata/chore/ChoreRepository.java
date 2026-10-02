package com.manaKhata.chore;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChoreRepository extends JpaRepository<Chore, Long> {
    List<Chore> findByHouseholdIdOrderByDueDateAsc(Long householdId);
    List<Chore> findByAssignedToIdOrderByDueDateAsc(Long userId);
}
