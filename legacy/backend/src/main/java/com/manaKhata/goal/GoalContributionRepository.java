package com.manaKhata.goal;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GoalContributionRepository extends JpaRepository<GoalContribution, Long> {
    List<GoalContribution> findByGoalIdOrderByContributionDateDesc(Long goalId);
}
