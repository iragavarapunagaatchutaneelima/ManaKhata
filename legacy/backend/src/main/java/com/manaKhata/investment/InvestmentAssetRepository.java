package com.manaKhata.investment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvestmentAssetRepository extends JpaRepository<InvestmentAsset, Long> {
    List<InvestmentAsset> findByHouseholdIdOrderByInvestmentDateDesc(Long householdId);
    List<InvestmentAsset> findByOwnerIdOrderByInvestmentDateDesc(Long ownerId);
}
