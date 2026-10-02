package com.manaKhata.asset;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VehicleExpenseRepository extends JpaRepository<VehicleExpense, Long> {
    List<VehicleExpense> findByVehicleId(Long vehicleId);
    List<VehicleExpense> findByContributorId(Long contributorId);

    @Query("SELECT SUM(ve.amount) FROM VehicleExpense ve WHERE ve.vehicle.id = :vehicleId AND ve.expenseType = 'FUEL'")
    Double sumFuelByVehicle(@Param("vehicleId") Long vehicleId);

    @Query("SELECT SUM(ve.amount) FROM VehicleExpense ve WHERE ve.vehicle.id = :vehicleId AND ve.expenseType != 'FUEL'")
    Double sumMaintenanceByVehicle(@Param("vehicleId") Long vehicleId);

    @Query("SELECT ve.contributor.id, ve.contributor.fullName, SUM(ve.amount) FROM VehicleExpense ve WHERE ve.vehicle.id = :vehicleId GROUP BY ve.contributor.id, ve.contributor.fullName")
    List<Object[]> getContributionBreakdown(@Param("vehicleId") Long vehicleId);
}
