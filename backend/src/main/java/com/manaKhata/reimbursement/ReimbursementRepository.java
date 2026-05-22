package com.manaKhata.reimbursement;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReimbursementRepository extends JpaRepository<Reimbursement, Long> {
    Page<Reimbursement> findByHouseholdId(Long householdId, Pageable pageable);
    Page<Reimbursement> findByPayerId(Long payerId, Pageable pageable);
    List<Reimbursement> findByHouseholdIdAndStatus(Long householdId, ReimbursementStatus status);
    List<Reimbursement> findByPayerIdAndStatus(Long payerId, ReimbursementStatus status);

    @Query("SELECT SUM(r.amount) FROM Reimbursement r WHERE r.household.id = :householdId AND r.status = 'PENDING'")
    Double sumPendingByHousehold(@Param("householdId") Long householdId);

    @Query("SELECT SUM(r.amount) FROM Reimbursement r WHERE r.payer.id = :userId AND r.status = 'PENDING'")
    Double sumPendingByUser(@Param("userId") Long userId);
}
