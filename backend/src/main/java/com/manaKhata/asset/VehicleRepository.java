package com.manaKhata.asset;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    List<Vehicle> findByHouseholdId(Long householdId);
    List<Vehicle> findByOwnerId(Long ownerId);
}

